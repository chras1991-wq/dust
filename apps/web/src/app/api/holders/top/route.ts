import { getSupplySnapshot } from "@/lib/store";
import { buildHolderTop10 } from "@/lib/holder-leaderboard";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "holders-top", 60, 60_000);
  if (limited) return limited;

  const realMinted = getSupplySnapshot().minted + getSupplySnapshot().pending;
  const holders = buildHolderTop10(realMinted).map(({ rank, address, amount }) => ({
    rank,
    address,
    amount,
  }));
  return noStoreJson({
    title: "Holder Top 10",
    holders,
    updatedAt: Date.now(),
  });
}
