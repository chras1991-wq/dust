import { listMints, getSupplySnapshot, getStore } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { getRealMintTotals, hydrateMintStore } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

const PUBLIC_MINT = new Set([
  "COMMIT_BROADCAST",
  "COMMIT_CONFIRMED",
  "REVEAL_BROADCAST",
  "REVEAL_MEMPOOL",
  "REVEAL_CONFIRMED",
  "INDEXER_PENDING",
  "DUST_VALID",
]);

export async function GET(req: Request) {
  const limited = await rateLimit(req, "activity", 60, 60_000);
  if (limited) return limited;

  await hydrateMintStore(true);
  const totals = await getRealMintTotals();
  const supply = getSupplySnapshot();
  const mints = listMints()
    .filter((m) => PUBLIC_MINT.has(m.status))
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
    supply: {
      ...supply,
      minted: totals.minted,
      pending: totals.pending,
    },
    deployTxid: getStore().deployTxid,
    activity: mints,
  });
}
