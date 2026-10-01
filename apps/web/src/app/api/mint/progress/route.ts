import { displayMintProgress } from "@/lib/virtual-progress";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { GENESIS_SUPPLY, isGenesisMintClosed } from "@satdust/shared";
import { getRealMintTotals } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await rateLimit(req, "mint-progress", 180, 60_000);
  if (limited) return limited;

  const totals = await getRealMintTotals();
  const realMinted = totals.minted + totals.pending;
  const nowMs = Date.now();
  const progress = displayMintProgress(realMinted, nowMs);

  return noStoreJson({
    displayMinted: progress.displayMinted,
    authorized: GENESIS_SUPPLY,
    paused: progress.paused,
    virtualFrozen: progress.virtualFrozen,
    genesisClosed: isGenesisMintClosed(nowMs),
  });
}
