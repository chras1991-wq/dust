import "server-only";
import type { MintRecord } from "@/lib/store";
import { getStore, upsertMint as upsertMintLocal } from "@/lib/store";
import { getKv, kvEnabled } from "@/lib/server/kv";

const COUNTER_KEY = "satdust:v1:counters";
const MINT_IDS_KEY = "satdust:v1:mint:ids";
const MINT_KEY_PREFIX = "satdust:v1:mint:";
const QUOTE_KEY_PREFIX = "satdust:v1:quote:consumed:";
const WALLET_KEY_PREFIX = "satdust:v1:wallet:";

let lastHydrateMs = 0;
const HYDRATE_TTL_MS = 2_000;

export type SyncBackend = "redis" | "memory";

export function syncBackend(): SyncBackend {
  return kvEnabled() ? "redis" : "memory";
}

/** Pull global counters + recent mint index into the in-process cache (short TTL). */
export async function hydrateMintStore(force = false): Promise<void> {
  const kv = getKv();
  if (!kv) return;

  const now = Date.now();
  if (!force && now - lastHydrateMs < HYDRATE_TTL_MS) return;
  lastHydrateMs = now;

  const counters = await kv.hgetall<Record<string, string>>(COUNTER_KEY);
  const store = getStore();
  if (counters?.confirmed != null) {
    store.confirmedMinted = Number(counters.confirmed) || 0;
  }
  if (counters?.pending != null) {
    store.pendingMinted = Number(counters.pending) || 0;
  }

  const ids = (await kv.smembers(MINT_IDS_KEY)) as string[];
  if (!ids?.length) return;

  const slice = ids.slice(-400);
  const records = await kv.mget<(string | MintRecord | null)[]>(
    ...slice.map((id) => `${MINT_KEY_PREFIX}${id}`)
  );
  for (const raw of records) {
    if (!raw) continue;
    const mint = typeof raw === "string" ? (JSON.parse(raw) as MintRecord) : raw;
    upsertMintLocal(mint);
  }
}

async function persistCounters(delta: { pending?: number; confirmed?: number }) {
  const kv = getKv();
  const store = getStore();
  if (delta.pending) store.pendingMinted += delta.pending;
  if (delta.confirmed) store.confirmedMinted += delta.confirmed;

  if (!kv) return;

  const pipe = kv.pipeline();
  if (delta.pending) pipe.hincrby(COUNTER_KEY, "pending", delta.pending);
  if (delta.confirmed) pipe.hincrby(COUNTER_KEY, "confirmed", delta.confirmed);
  await pipe.exec();
}

export async function persistMintRecord(mint: MintRecord): Promise<void> {
  upsertMintLocal(mint);
  const kv = getKv();
  if (!kv) return;

  await kv
    .pipeline()
    .set(`${MINT_KEY_PREFIX}${mint.id}`, mint)
    .sadd(MINT_IDS_KEY, mint.id)
    .exec();
}

/**
 * Atomically reserve quote units across all serverless instances.
 * Returns false when the signed quote cannot cover the batch.
 */
export async function tryConsumeQuoteUnits(
  quoteId: string,
  units: number,
  maxUnits: number
): Promise<boolean> {
  const kv = getKv();
  if (!kv) {
    const store = getStore();
    const prev = store.quoteUnitsConsumed.get(quoteId) ?? 0;
    if (prev + units > maxUnits) return false;
    store.quoteUnitsConsumed.set(quoteId, prev + units);
    return true;
  }

  const key = `${QUOTE_KEY_PREFIX}${quoteId}`;
  const next = await kv.incrby(key, units);
  if (next > maxUnits) {
    await kv.decrby(key, units);
    return false;
  }
  const store = getStore();
  const prev = store.quoteUnitsConsumed.get(quoteId) ?? 0;
  store.quoteUnitsConsumed.set(quoteId, prev + units);
  return true;
}

export type WalletMintEntry = {
  mintId: string;
  amount: number;
  status: string;
  createdAt: number;
  revealTxid: string | null;
};

function walletMintKey(address: string): string {
  return `${WALLET_KEY_PREFIX}${address.toLowerCase()}:mints`;
}

async function pushWalletMint(mint: MintRecord): Promise<void> {
  const kv = getKv();
  if (!kv || !mint.walletAddress) return;
  const entry: WalletMintEntry = {
    mintId: mint.id,
    amount: mint.amount,
    status: mint.status,
    createdAt: mint.createdAt,
    revealTxid: mint.revealTxid ?? null,
  };
  const key = walletMintKey(mint.walletAddress);
  await kv.lpush(key, entry);
  await kv.ltrim(key, 0, 19);
}

export async function listWalletMints(address: string): Promise<WalletMintEntry[]> {
  const kv = getKv();
  if (!kv) return [];
  const raw = await kv.lrange<WalletMintEntry | string>(walletMintKey(address), 0, 19);
  if (!raw?.length) return [];
  return raw.flatMap((item) => {
    const entry = typeof item === "string" ? (JSON.parse(item) as WalletMintEntry) : item;
    if (!entry || typeof entry.amount !== "number" || !entry.mintId) return [];
    return [entry];
  });
}

export async function recordMintBroadcast(
  mint: MintRecord,
  pendingUnits: number
): Promise<void> {
  await persistMintRecord(mint);
  if (pendingUnits > 0) {
    await persistCounters({ pending: pendingUnits });
    const kv = getKv();
    if (kv && mint.walletAddress) {
      await kv.hincrby(
        `${WALLET_KEY_PREFIX}${mint.walletAddress.toLowerCase()}`,
        "balance",
        pendingUnits
      );
    }
    await pushWalletMint(mint);
  }
}

export async function getWalletBalancePersisted(address: string): Promise<number | null> {
  const kv = getKv();
  if (!kv) return null;
  const v = await kv.hget<number>(`${WALLET_KEY_PREFIX}${address.toLowerCase()}`, "balance");
  return v ?? 0;
}

export async function getRealMintTotals(): Promise<{ minted: number; pending: number }> {
  await hydrateMintStore();
  const s = getStore();
  return { minted: s.confirmedMinted, pending: s.pendingMinted };
}
