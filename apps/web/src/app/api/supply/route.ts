import { getSupplySnapshot } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { hydrateMintStore } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await rateLimit(req, "supply", 120, 60_000);
  if (limited) return limited;
  await hydrateMintStore();
  return noStoreJson(getSupplySnapshot());
}
