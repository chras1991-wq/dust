import "server-only";
import { usdToFeeSats } from "@satdust/quote";
import { UNIT_SATS } from "@satdust/shared";
import { PROJECT_ADDRESS } from "@satdust/shared/project";
import {
  projectPaymentsFromTxs,
  type ChainPayment,
  type MempoolTxLike,
  creditQtyForPayment,
} from "@/lib/chain-credit";
import { getKv } from "@/lib/server/kv";
import { listMints } from "@/lib/store";
import { hydrateMintStore, recordMintBroadcast } from "@/lib/server/mint-persist";

const CREDIT_PREFIX = "satdust:v1:credit:";
const LOCK_PREFIX = "satdust:v1:credit-lock:";
const RECONCILE_TTL_MS = 12_000;
const LOCK_TTL_SEC = 30;

const reconcileAt = new Map<string, number>();
const priceCache = new Map<string, number>();

type CreditMem = { done: Set<string>; locks: Set<string> };
function creditMem(): CreditMem {
  const g = globalThis as { __satdustCreditMem?: CreditMem };
  g.__satdustCreditMem ??= { done: new Set(), locks: new Set() };
  return g.__satdustCreditMem;
}

function txidOf(txid: string): string | null {
  const id = txid.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(id) ? id : null;
}

/** True when this caller may add the tx to balances. Empty txid does not lock. */
export async function claimMintCredit(txid: string): Promise<boolean> {
  const id = txidOf(txid);
  if (!id) return true;

  const doneKey = `${CREDIT_PREFIX}${id}`;
  const lockKey = `${LOCK_PREFIX}${id}`;
  const mem = creditMem();
  if (mem.done.has(doneKey) || mem.locks.has(lockKey)) return false;

  const kv = getKv();
  if (!kv) {
    mem.locks.add(lockKey);
    return true;
  }

  if ((await kv.get(doneKey)) != null) return false;
  const res = await kv.set(lockKey, "1", { nx: true, ex: LOCK_TTL_SEC });
  if (res !== "OK") return false;
  if ((await kv.get(doneKey)) != null) {
    await kv.del(lockKey);
    return false;
  }
  return true;
}

export async function markMintCredit(txid: string): Promise<void> {
  const id = txidOf(txid);
  if (!id) return;
  const doneKey = `${CREDIT_PREFIX}${id}`;
  const lockKey = `${LOCK_PREFIX}${id}`;
  const mem = creditMem();
  mem.done.add(doneKey);
  mem.locks.delete(lockKey);
  const kv = getKv();
  if (!kv) return;
  await kv.set(doneKey, "1");
  await kv.del(lockKey);
}

export async function releaseMintCredit(txid: string): Promise<void> {
  const id = txidOf(txid);
  if (!id) return;
  const lockKey = `${LOCK_PREFIX}${id}`;
  creditMem().locks.delete(lockKey);
  const kv = getKv();
  if (kv) await kv.del(lockKey);
}

async function alreadyCredited(txid: string): Promise<boolean> {
  const id = txid.toLowerCase();
  if (listMints().some((m) => (m.revealTxid ?? m.commitTxid ?? "").toLowerCase() === id)) {
    return true;
  }
  const doneKey = `${CREDIT_PREFIX}${id}`;
  if (creditMem().done.has(doneKey)) return true;
  const kv = getKv();
  if (!kv) return false;
  return (await kv.get(doneKey)) != null;
}

function priceInterval(unixSec: number): number {
  const age = Math.floor(Date.now() / 1000) - unixSec;
  if (age < 8 * 3600) return 1;
  if (age < 25 * 86400) return 60;
  return 1440;
}

async function btcUsdAt(unixSec: number): Promise<number | null> {
  const interval = priceInterval(unixSec);
  const span = interval * 60;
  const bucket = Math.floor(unixSec / span) * span;
  const cacheKey = `${interval}:${bucket}`;
  const hit = priceCache.get(cacheKey);
  if (hit) return hit;

  try {
    const since = Math.max(0, unixSec - span * 3);
    const res = await fetch(
      `https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=${interval}&since=${since}`,
      { cache: "no-store", signal: AbortSignal.timeout(8_000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: { XXBTZUSD?: [number, string, string, string, string][] };
    };
    const rows = data.result?.XXBTZUSD ?? [];
    let close: number | null = null;
    for (const row of rows) {
      const start = Number(row[0]);
      if (start <= unixSec && unixSec < start + span) {
        close = Number(row[4]);
        break;
      }
    }
    if (close == null && rows.length > 0) {
      const last = rows[rows.length - 1]!;
      const start = Number(last[0]);
      if (Math.abs(start - unixSec) < span * 2) close = Number(last[4]);
    }
    if (close == null || !Number.isFinite(close) || close <= 0) return null;
    priceCache.set(cacheKey, close);
    return close;
  } catch {
    return null;
  }
}

async function fetchJson(url: string): Promise<MempoolTxLike[] | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MempoolTxLike[];
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function fetchWalletTxs(address: string): Promise<MempoolTxLike[] | null> {
  const mempool = await fetchJson(
    `https://mempool.space/api/address/${address}/txs/mempool`
  );
  const chain: MempoolTxLike[] = [];
  let cursor = "";
  for (let page = 0; page < 4; page++) {
    const url = cursor
      ? `https://mempool.space/api/address/${address}/txs/chain/${cursor}`
      : `https://mempool.space/api/address/${address}/txs/chain`;
    const batch = await fetchJson(url);
    if (!batch) {
      if (page === 0) return mempool && mempool.length > 0 ? mempool : null;
      break;
    }
    chain.push(...batch);
    if (batch.length < 25) break;
    const last = batch[batch.length - 1]?.txid;
    if (!last || last === cursor) break;
    cursor = last;
  }
  return [...(mempool ?? []), ...chain];
}

async function creditPayment(address: string, payment: ChainPayment, qty: number): Promise<boolean> {
  const won = await claimMintCredit(payment.txid);
  if (!won) return false;

  const carrierSats = UNIT_SATS * qty;
  try {
    await recordMintBroadcast(
      {
        id: `chain_${payment.txid}`,
        walletAddress: address,
        quoteId: "chain",
        commitTxid: payment.txid,
        revealTxid: payment.txid,
        amount: qty,
        carrierSats,
        projectFeeSats: Math.max(0, payment.paidSats - carrierSats),
        status: "REVEAL_BROADCAST",
        createdAt: payment.seenAt,
        updatedAt: payment.seenAt,
      },
      qty
    );
    await markMintCredit(payment.txid);
    return true;
  } catch (err) {
    await releaseMintCredit(payment.txid);
    throw err;
  }
}

export async function reconcileWalletChainCredits(
  address: string,
  force = false
): Promise<{ units: number; txids: string[] }> {
  const addr = address.trim();
  if (!/^bc1[a-z0-9]{25,87}$/i.test(addr)) return { units: 0, txids: [] };

  const key = addr.toLowerCase();
  const now = Date.now();
  const last = reconcileAt.get(key) ?? 0;
  if (!force && now - last < RECONCILE_TTL_MS) return { units: 0, txids: [] };

  const txs = await fetchWalletTxs(key);
  if (!txs) return { units: 0, txids: [] };

  await hydrateMintStore(true);
  const payments = projectPaymentsFromTxs({
    address: addr,
    projectAddress: PROJECT_ADDRESS,
    txs,
    nowSec: Math.floor(now / 1000),
  });

  let units = 0;
  const txids: string[] = [];
  let priceMiss = false;
  for (const payment of payments) {
    if (await alreadyCredited(payment.txid)) continue;
    const btcUsd = await btcUsdAt(payment.seenAt);
    if (btcUsd == null) {
      priceMiss = true;
      continue;
    }
    const qty = creditQtyForPayment(payment.paidSats, usdToFeeSats(1, btcUsd));
    if (qty < 1) continue;
    const added = await creditPayment(addr, payment, qty);
    if (!added) continue;
    units += qty;
    txids.push(payment.txid);
  }

  if (!priceMiss) reconcileAt.set(key, now);
  return { units, txids };
}
