import { getSupplySnapshot, getStore } from "@/lib/store";
import { ensureStoreHydrated } from "@/lib/store-persist";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "supply", 120, 60_000);
  if (limited) return limited;
  await ensureStoreHydrated(getStore());
  return noStoreJson(getSupplySnapshot());
}
