import { listMints } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { getWalletBalancePersisted, hydrateMintStore } from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

const CREDITED = new Set([
  "PSBT_CREATED",
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

  await hydrateMintStore();
  const mints = listMints().filter((m) => m.walletAddress === address && CREDITED.has(m.status));
  const localBalance = mints.reduce((s, m) => s + m.amount, 0);
  const persisted = await getWalletBalancePersisted(address);
  const balance = persisted != null ? Math.max(localBalance, persisted) : localBalance;
  const records = mints.map((m) => ({
    mintId: m.id,
    amount: m.amount,
    status: m.status,
    createdAt: m.createdAt,
    revealTxid: m.revealTxid ?? null,
  }));

  return noStoreJson({
    address: `${address.slice(0, 6)}…${address.slice(-4)}`,
    balance,
    records,
  });
}
