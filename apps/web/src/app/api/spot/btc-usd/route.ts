import { fetchBtcUsdMedian } from "@/lib/prices";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "spot-btc-usd", 120, 60_000);
  if (limited) return limited;

  const { btcUsd } = await fetchBtcUsdMedian();
  return noStoreJson({ btcUsd });
}
