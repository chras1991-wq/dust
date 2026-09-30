import { reconcileWalletChainCredits } from "@/lib/server/chain-reconcile";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { getWalletBalancePersisted, listWalletMints } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

export async function GET(req: Request) {
  const limited = await rateLimit(req, "wallet-balance", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  if (!isValidBech32(address)) {
    return noStoreJson({ error: "Invalid address" }, { status: 400 });
  }

  const credited = await reconcileWalletChainCredits(
    address,
    searchParams.get("sync") === "1"
  );
  const persisted = await getWalletBalancePersisted(address);
  const indexed = await listWalletMints(address);
  const records = [...indexed].sort((a, b) => b.createdAt - a.createdAt);
  const fromRecords = records.reduce((sum, row) => sum + row.amount, 0);
  const balance = Math.max(persisted ?? 0, fromRecords);
  const btcSats = await fetchBtcSats(address.toLowerCase());

  return noStoreJson({
    address: `${address.slice(0, 6)}…${address.slice(-4)}`,
    balance,
    btcSats,
    records,
    credited: credited.units,
  });
}

async function fetchBtcSats(address: string): Promise<number | null> {
  try {
    const res = await fetch(`https://mempool.space/api/address/${address}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
      mempool_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
    };
    const chain = data.chain_stats ?? {};
    const mempool = data.mempool_stats ?? {};
    const sats =
      (chain.funded_txo_sum ?? 0) -
      (chain.spent_txo_sum ?? 0) +
      (mempool.funded_txo_sum ?? 0) -
      (mempool.spent_txo_sum ?? 0);
    return Number.isFinite(sats) ? Math.max(0, sats) : null;
  } catch {
    return null;
  }
}
