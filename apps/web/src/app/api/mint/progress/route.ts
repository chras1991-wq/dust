import { getSupplySnapshot } from "@/lib/store";
import { displayMintProgress, VIRTUAL_CAP, VIRTUAL_PROGRESS_START_MS } from "@/lib/virtual-progress";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "mint-progress", 120, 60_000);
  if (limited) return limited;

  const realMinted = getSupplySnapshot().minted + getSupplySnapshot().pending;
  const progress = displayMintProgress(realMinted);

  return noStoreJson({
    ...progress,
    virtualCap: VIRTUAL_CAP,
    campaignStartMs: VIRTUAL_PROGRESS_START_MS,
    serverTimeMs: Date.now(),
    disclaimer: "mint进度部分为虚拟进度",
  });
}
