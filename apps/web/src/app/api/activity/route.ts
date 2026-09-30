import { listMints, getSupplySnapshot, getStore } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "activity", 60, 60_000);
  if (limited) return limited;

  const mints = listMints()
    .filter((m) =>
      ["DUST_VALID", "REVEAL_CONFIRMED", "INDEXER_PENDING", "REVEAL_MEMPOOL"].includes(
        m.status
      )
    )
    .slice(0, 100)
    .map((m, i, arr) => ({
      mintSequence: m.mintSequence ?? arr.length - i,
      txid: m.revealTxid ?? null,
      inscriptionId: m.inscriptionId ?? null,
      // Truncate owner in API responses — full address stays server-side.
      owner: m.walletAddress
        ? `${m.walletAddress.slice(0, 6)}…${m.walletAddress.slice(-4)}`
        : "",
      amount: m.amount,
      carrierSats: m.carrierSats,
      block: m.blockHeight ?? null,
      status: m.status,
    }));

  return noStoreJson({
    supply: getSupplySnapshot(),
    deployTxid: getStore().deployTxid,
    activity: mints,
  });
}
