import { listMints, listSwaps, getStore } from "@/lib/store";
import { ensureStoreHydrated } from "@/lib/store-persist";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

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
  const limited = rateLimit(req, "wallet-balance", 60, 60_000);
  if (limited) return limited;
  await ensureStoreHydrated(getStore());

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  if (!isValidBech32(address)) {
    return noStoreJson({ error: "Invalid address" }, { status: 400 });
  }

  const mints = listMints().filter((m) => m.walletAddress === address && CREDITED.has(m.status));
  let balance = mints.reduce((s, m) => s + m.amount, 0);
  for (const swap of listSwaps()) {
    if (swap.walletAddress !== address) continue;
    if (swap.direction === "BTC_TO_SATDUST") balance += swap.satdustAmount;
    else balance -= swap.satdustAmount;
  }
  balance = Math.max(0, Math.round(balance * 10_000) / 10_000);
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
    ledgerSize: getStore().mints.length,
    persisted: Boolean(process.env.KV_REST_API_URL || process.env.KV_URL),
  });
}
