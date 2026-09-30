import { getSupplySnapshot } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { getRealMintTotals } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await rateLimit(req, "supply", 120, 60_000);
  if (limited) return limited;
  const totals = await getRealMintTotals();
  const snap = getSupplySnapshot();
  return noStoreJson({
    ...snap,
    minted: totals.minted,
    pending: totals.pending,
    remaining: Math.max(0, snap.totalSupply - totals.minted),
    availableEstimated: Math.max(0, snap.totalSupply - totals.minted - totals.pending),
  });
}
