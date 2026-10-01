import "server-only";
import { kv } from "@vercel/kv";
import type { MintRecord, Store, SwapRecord } from "@/lib/store";

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
  var __satdustPersistTimer: ReturnType<typeof setTimeout> | undefined;
}

function kvEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL || process.env.KV_URL);
}

export async function hydrateStore(store: Store): Promise<void> {
  if (!kvEnabled()) return;
  try {
    const snap = await kv.get<StoreSnapshot>(STORE_KEY);
    if (!snap) return;
    store.mints = Array.isArray(snap.mints) ? snap.mints : [];
    store.swaps = Array.isArray(snap.swaps) ? snap.swaps : [];
    store.confirmedMinted = Number(snap.confirmedMinted) || 0;
    store.pendingMinted = Number(snap.pendingMinted) || 0;
    store.deployTxid = snap.deployTxid ?? store.deployTxid;
    store.deployInscriptionId = snap.deployInscriptionId ?? store.deployInscriptionId;
  } catch {
    /* KV optional */
  }
}

export async function persistStore(store: Store): Promise<void> {
  if (!kvEnabled()) return;
  const snap: StoreSnapshot = {
    mints: store.mints,
    swaps: store.swaps,
    confirmedMinted: store.confirmedMinted,
    pendingMinted: store.pendingMinted,
    deployTxid: store.deployTxid,
    deployInscriptionId: store.deployInscriptionId,
    updatedAt: Date.now(),
  };
  try {
    await kv.set(STORE_KEY, snap);
  } catch {
    /* ignore */
  }
}

export function schedulePersistStore(store: Store): void {
  if (!kvEnabled()) return;
  if (globalThis.__satdustPersistTimer) clearTimeout(globalThis.__satdustPersistTimer);
  globalThis.__satdustPersistTimer = setTimeout(() => {
    void persistStore(store);
  }, 800);
}

export async function ensureStoreHydrated(store: Store): Promise<void> {
  if (globalThis.__satdustStoreHydrated) return;
  await hydrateStore(store);
  globalThis.__satdustStoreHydrated = true;
}
