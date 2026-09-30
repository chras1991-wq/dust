import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** Holder ranks were removed. Keep the route so old clients get an empty list. */
export async function GET(req: Request) {
  const limited = await rateLimit(req, "holders-top", 60, 60_000);
  if (limited) return limited;

  return noStoreJson({
    title: "Holders",
    holders: [],
    updatedAt: Date.now(),
  });
}
