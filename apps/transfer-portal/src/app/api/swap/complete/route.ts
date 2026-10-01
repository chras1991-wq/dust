import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

function upstreamBase(): string {
  return (process.env.INDEX_API_URL?.trim() || "https://dust20.com").replace(/\/$/, "");
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "swap-complete", 30, 60_000);
  if (limited) return limited;

  const body = await req.text();
  try {
    const res = await fetch(`${upstreamBase()}/api/swap/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const data = await res.json();
    return noStoreJson(data, { status: res.status });
  } catch {
    return noStoreJson({ ok: true }, { status: 200 });
  }
}
