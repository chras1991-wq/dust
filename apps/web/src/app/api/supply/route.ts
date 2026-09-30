import { getSupplySnapshot } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "supply", 120, 60_000);
  if (limited) return limited;
  return noStoreJson(getSupplySnapshot());
}
