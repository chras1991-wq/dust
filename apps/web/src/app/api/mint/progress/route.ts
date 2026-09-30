import { displayMintProgress, VIRTUAL_CAP, VIRTUAL_PROGRESS_START_MS } from "@/lib/virtual-progress";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { getRealMintTotals, syncBackend } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await rateLimit(req, "mint-progress", 180, 60_000);
  if (limited) return limited;

  const totals = await getRealMintTotals();
  const realMinted = totals.minted + totals.pending;
  const nowMs = Date.now();
  const progress = displayMintProgress(realMinted, nowMs);

  return noStoreJson({
    ...progress,
    virtualCap: VIRTUAL_CAP,
    campaignStartMs: VIRTUAL_PROGRESS_START_MS,
    serverTimeMs: nowMs,
    sync: {
      backend: syncBackend(),
      virtualSource: "server_clock",
      realSource: syncBackend() === "redis" ? "redis_counters" : "instance_memory",
    },
  });
}
