import { NextResponse, type NextRequest } from "next/server";
import { edgeRateLimit } from "@/lib/server/edge-rate";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-site",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
};

function applySecurity(res: NextResponse, pathname: string) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  if (pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("Pragma", "no-cache");
  }
  res.headers.delete("x-powered-by");
  return res;
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  return xf || real || "unknown";
}

function adminAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected || expected.length < 16) return false;
  const header = req.headers.get("x-admin-token")?.trim();
  const cookie = req.cookies.get("admin_token")?.value?.trim();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return header === expected || cookie === expected || bearer === expected;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.endsWith(".map") ||
    pathname.includes("/.git") ||
    pathname.includes("/.env") ||
    pathname.includes("/node_modules") ||
    pathname.includes("/.next/") ||
    pathname.endsWith(".ts") ||
    pathname.endsWith(".tsx")
  ) {
    return applySecurity(new NextResponse(null, { status: 404 }), pathname);
  }

  if (pathname.startsWith("/api/")) {
    const kind = pathname.includes("/mint") ? "mint" : "api";
    const rl = edgeRateLimit(clientIp(req), kind);
    if (!rl.ok) {
      return applySecurity(
        NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: { "Retry-After": String(rl.retryAfterSec) },
          }
        ),
        pathname
      );
    }
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!adminAuthorized(req)) {
      return applySecurity(new NextResponse(null, { status: 404 }), pathname);
    }
  }

  const res = NextResponse.next();
  return applySecurity(res, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
