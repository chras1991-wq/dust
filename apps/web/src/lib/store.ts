import "server-only";
import type { QuoteRecord } from "@satdust/quote";
import type { MintStatus } from "@satdust/bitcoin";
import { SUPPLY } from "@satdust/shared";

export type MintRecord = {
  id: string;
  walletAddress: string;
  quoteId: string;
  commitTxid?: string;
  revealTxid?: string;
  inscriptionId?: string;
  mintSequence?: number;
  amount: number;
  carrierSats: number;
  projectFeeSats: number;
  minerFeeSats?: number;
  status: MintStatus;
  blockHeight?: number;
  createdAt: number;
  updatedAt: number;
  invalidReason?: string;
};

type Store = {
  quotes: Map<string, QuoteRecord>;
  /** Units already reserved from a signed quote (1 SATDUST = 1 unit). */
  quoteUnitsConsumed: Map<string, number>;
  mints: MintRecord[];
  /** Confirmed DUST-valid mint count. Chain/indexer is source of truth; this is cache. */
  confirmedMinted: number;
  pendingMinted: number;
  deployTxid: string | null;
  deployInscriptionId: string | null;
};

declare global {
  var __satdustStore: Store | undefined;
}

function createStore(): Store {
  return {
    quotes: new Map(),
    quoteUnitsConsumed: new Map(),
    mints: [],
    // Real confirmed count only — default 0 until indexer/mints update it.
    confirmedMinted: Number(process.env.MOCK_MINTED ?? 0),
    pendingMinted: Number(process.env.MOCK_PENDING ?? 0),
    deployTxid: process.env.DEPLOY_TXID || null,
    deployInscriptionId: process.env.DEPLOY_INSCRIPTION_ID || null,
  };
}

export function getStore(): Store {
  if (!globalThis.__satdustStore) {
    globalThis.__satdustStore = createStore();
  }
  return globalThis.__satdustStore;
}

export function getSupplySnapshot() {
  const s = getStore();
  const remaining = Math.max(0, SUPPLY - s.confirmedMinted - s.pendingMinted);
  return {
    totalSupply: SUPPLY,
    minted: s.confirmedMinted,
    remaining: Math.max(0, SUPPLY - s.confirmedMinted),
    pending: s.pendingMinted,
    availableEstimated: remaining,
    highContention: remaining <= 20 && remaining > 0,
  };
}

export function saveQuote(quote: QuoteRecord) {
  getStore().quotes.set(quote.quoteId, quote);
}

export function getQuote(quoteId: string): QuoteRecord | undefined {
  return getStore().quotes.get(quoteId);
}

export function getQuoteUnitsConsumed(quoteId: string): number {
  return getStore().quoteUnitsConsumed.get(quoteId) ?? 0;
}

export function consumeQuoteUnits(quoteId: string, units: number) {
  const store = getStore();
  const prev = store.quoteUnitsConsumed.get(quoteId) ?? 0;
  store.quoteUnitsConsumed.set(quoteId, prev + units);
}

export function listMints(): MintRecord[] {
  return [...getStore().mints].sort((a, b) => b.createdAt - a.createdAt);
}

export function upsertMint(mint: MintRecord) {
  const store = getStore();
  const idx = store.mints.findIndex((m) => m.id === mint.id);
  if (idx >= 0) store.mints[idx] = mint;
  else store.mints.push(mint);
}
