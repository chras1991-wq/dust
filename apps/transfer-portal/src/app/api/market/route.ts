import { usdToFeeSats } from "@satdust/quote";
import { marketSnapshot } from "@/lib/index-market";
import { fetchBtcUsdMedian } from "@/lib/prices";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "market", 120, 60_000);
  if (limited) return limited;

  const { btcUsd } = await fetchBtcUsdMedian();
  const snap = marketSnapshot(Date.now(), 120);
  const satsPerUnit = usdToFeeSats(snap.usdPerUnit, btcUsd);

  return noStoreJson({
    u: snap.usdPerUnit,
    s: satsPerUnit,
    b: snap.bars,
    m: snap.minute,
  });
}
