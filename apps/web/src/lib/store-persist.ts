import "server-only";
import { kv } from "@vercel/kv";
import type { MintRecord, Store, SwapRecord } from "@/lib/store";
import {
  applyLedgerRows,
  mergeMintRecords,
  parseEnvLedgerBootstrap,
  recomputeMintTotals,
} from "@/lib/ledger-bootstrap";

const STORE_KEY = "satdust:store:v1";

type StoreSnapshot = {
  mints: MintRecord[];
  swaps: SwapRecord[];
  confirmedMinted: number;
  pendingMinted: number;
  deployTxid: string | null;
  deployInscriptionId: string | null;
  updatedAt: number;
};

declare global {
  var __satdustStoreHydrated: boolean | undefined;
  var __satdustPersistInFlight: Promise<void> | undefined;
}

function kvEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL || process.env.KV_URL);
}

function snapshotFromStore(store: Store): StoreSnapshot {
  return {
    mints: store.mints,
    swaps: store.swaps,
    confirmedMinted: store.confirmedMinted,
    pendingMinted: store.pendingMinted,
    deployTxid: store.deployTxid,
    deployInscriptionId: store.deployInscriptionId,
    updatedAt: Date.now(),
  };
}

function mergeSnapshots(existing: StoreSnapshot, next: StoreSnapshot): StoreSnapshot {
  const mergedMints = mergeMintRecords(
    Array.isArray(existing.mints) ? existing.mints : [],
    Array.isArray(next.mints) ? next.mints : []
  );
  return {
    mints: mergedMints,
    swaps:
      next.swaps.length > 0
        ? next.swaps
        : Array.isArray(existing.swaps)
          ? existing.swaps
          : [],
    confirmedMinted: Math.max(existing.confirmedMinted || 0, next.confirmedMinted || 0),
    pendingMinted: Math.max(existing.pendingMinted || 0, next.pendingMinted || 0),
    deployTxid: next.deployTxid ?? existing.deployTxid ?? null,
    deployInscriptionId: next.deployInscriptionId ?? existing.deployInscriptionId ?? null,
    updatedAt: Date.now(),
  };
}

export async function persistStore(store: Store): Promise<void> {
  if (!kvEnabled()) return;
  const next = snapshotFromStore(store);
  if (next.mints.length === 0 && next.swaps.length === 0) {
    return;
  }
  try {
    const existing = await kv.get<StoreSnapshot>(STORE_KEY);
    const toWrite =
      existing && (existing.mints?.length || existing.swaps?.length)
        ? mergeSnapshots(existing, next)
        : next;
    if (
      existing &&
      existing.mints?.length &&
      toWrite.mints.length === 0
    ) {
      return;
    }
    await kv.set(STORE_KEY, toWrite);
  } catch {
    /* KV optional */
  }
}

/** Immediate persist — required on serverless (debounced writes often never flush). */
export function schedulePersistStore(store: Store): void {
  if (!kvEnabled()) return;
  const run = async () => {
    recomputeMintTotals(store);
    await persistStore(store);
  };
  const chain = globalThis.__satdustPersistInFlight
    ? globalThis.__satdustPersistInFlight.then(run, run)
    : run();
  globalThis.__satdustPersistInFlight = chain.catch(() => undefined);
}

export async function hydrateStore(store: Store): Promise<void> {
  if (!kvEnabled()) {
    applyLedgerRows(store, parseEnvLedgerBootstrap());
    recomputeMintTotals(store);
    return;
  }
  try {
    const snap = await kv.get<StoreSnapshot>(STORE_KEY);
    if (snap) {
      store.mints = Array.isArray(snap.mints) ? snap.mints : [];
      store.swaps = Array.isArray(snap.swaps) ? snap.swaps : [];
      store.confirmedMinted = Number(snap.confirmedMinted) || 0;
      store.pendingMinted = Number(snap.pendingMinted) || 0;
      store.deployTxid = snap.deployTxid ?? store.deployTxid;
      store.deployInscriptionId = snap.deployInscriptionId ?? store.deployInscriptionId;
    }
  } catch {
    /* KV optional */
  }

  const added = applyLedgerRows(store, parseEnvLedgerBootstrap());
  recomputeMintTotals(store);
  if (added > 0) await persistStore(store);
}

export async function ensureStoreHydrated(store: Store): Promise<void> {
  if (globalThis.__satdustStoreHydrated) return;
  await hydrateStore(store);
  globalThis.__satdustStoreHydrated = true;
}

export async function importLedgerRows(
  store: Store,
  rows: Parameters<typeof applyLedgerRows>[1]
): Promise<{ merged: number; totalMints: number }> {
  const merged = applyLedgerRows(store, rows);
  await persistStore(store);
  return { merged, totalMints: store.mints.length };
}
