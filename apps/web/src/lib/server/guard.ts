import "server-only";
import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request, route: string): string {
  const xf = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  const ip = xf || real || "unknown";
  return `${route}:${ip}`;
}

/** Simple in-memory rate limit (per instance). Redundant with edge limits. */
export function rateLimit(
  req: Request,
  route: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const key = clientKey(req, route);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retry = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests — slow down" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retry),
          "Cache-Control": "no-store",
        },
      }
    );
  }
  return null;
}

const MAX_BODY = 48_000;

export async function readJsonBody<T>(
  req: Request
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Payload too large" }, { status: 413 }),
    };
  }

  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Payload too large" }, { status: 413 }),
      };
    }
    if (!text.trim()) {
      return { ok: true, body: {} as T };
    }
    return { ok: true, body: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

export function noStoreJson(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
