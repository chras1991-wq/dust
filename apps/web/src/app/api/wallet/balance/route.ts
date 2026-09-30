import { listMints } from "@/lib/store";
import { reconcileWalletChainCredits } from "@/lib/server/chain-reconcile";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import {
  getWalletBalancePersisted,
  hydrateMintStore,
  listWalletMints,
  type WalletMintEntry,
} from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

const CREDITED = new Set([
  "COMMIT_SIGNED",
  "COMMIT_BROADCAST",
  "COMMIT_CONFIRMED",
  "REVEAL_CREATED",
  "REVEAL_SIGNED",
  "REVEAL_BROADCAST",
  "REVEAL_MEMPOOL",
  "REVEAL_CONFIRMED",
  "INDEXER_PENDING",
  "DUST_VALID",
]);

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
  await hydrateMintStore(true);
  const addr = address.toLowerCase();
  const mints = listMints().filter(
    (m) => m.walletAddress.toLowerCase() === addr && CREDITED.has(m.status)
  );
  const localBalance = mints.reduce((s, m) => s + m.amount, 0);
  const persisted = await getWalletBalancePersisted(address);
  const balance = persisted != null ? Math.max(localBalance, persisted) : localBalance;
  const indexed = await listWalletMints(address);
  const fromStore: WalletMintEntry[] = mints.map((m) => ({
    mintId: m.id,
    amount: m.amount,
    status: m.status,
    createdAt: m.createdAt,
    revealTxid: m.revealTxid ?? null,
  }));
  const records = mergeMintRecords(indexed, fromStore);
  const btcSats = await fetchBtcSats(addr);

  return noStoreJson({
    address: `${address.slice(0, 6)}…${address.slice(-4)}`,
    balance,
    btcSats,
    records,
    credited: credited.units,
  });
}

function mergeMintRecords(primary: WalletMintEntry[], extra: WalletMintEntry[]): WalletMintEntry[] {
  const seen = new Set<string>();
  const out: WalletMintEntry[] = [];
  for (const row of [...primary, ...extra]) {
    if (seen.has(row.mintId)) continue;
    seen.add(row.mintId);
    out.push(row);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
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
