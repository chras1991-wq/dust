import "server-only";
import type { MintRecord, Store } from "@/lib/store";
import type { MintStatus } from "@satdust/bitcoin";
import { UNIT_SATS } from "@satdust/shared";

export type LedgerImportRow = {
  address: string;
  amount: number;
  revealTxid?: string | null;
  commitTxid?: string | null;
  status?: string;
  mintId?: string;
};

const RESTORED_STATUSES = new Set<string>([
  "DUST_VALID",
  "REVEAL_CONFIRMED",
  "REVEAL_BROADCAST",
  "REVEAL_MEMPOOL",
  "INDEXER_PENDING",
]);

function isBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

export function parseLedgerImportRows(raw: unknown): LedgerImportRow[] {
  if (!Array.isArray(raw)) return [];
  const out: LedgerImportRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const address = String((row as LedgerImportRow).address ?? "").trim();
    const amount = Math.floor(Number((row as LedgerImportRow).amount));
    if (!isBech32(address) || !Number.isFinite(amount) || amount < 1 || amount > 500) continue;
    out.push({
      address,
      amount,
      revealTxid: (row as LedgerImportRow).revealTxid ?? null,
      commitTxid: (row as LedgerImportRow).commitTxid ?? null,
      status: (row as LedgerImportRow).status,
      mintId: (row as LedgerImportRow).mintId,
    });
  }
  return out;
}

export function parseEnvLedgerBootstrap(): LedgerImportRow[] {
  const raw = process.env.MINT_LEDGER_JSON?.trim();
  if (!raw) return [];
  try {
    return parseLedgerImportRows(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function rowsToMintRecords(rows: LedgerImportRow[], prefix = "restored"): MintRecord[] {
  const now = Math.floor(Date.now() / 1000);
  return rows.map((row, i) => {
    const status = (
      row.status && RESTORED_STATUSES.has(row.status) ? row.status : "REVEAL_CONFIRMED"
    ) as MintStatus;
    const id =
      row.mintId?.trim() ||
      `${prefix}_${row.address.slice(4, 12)}_${row.amount}_${row.revealTxid?.slice(0, 12) ?? i}`;
    return {
      id,
      walletAddress: row.address,
      quoteId: "restored",
      amount: row.amount,
      carrierSats: UNIT_SATS,
      projectFeeSats: row.amount * 100_000,
      status,
      commitTxid: row.commitTxid ?? undefined,
      revealTxid: row.revealTxid ?? undefined,
      createdAt: now - i,
      updatedAt: now,
    };
  });
}

export function mergeMintRecords(existing: MintRecord[], incoming: MintRecord[]): MintRecord[] {
  const byId = new Map<string, MintRecord>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) {
    const prev = byId.get(m.id);
    if (!prev || (m.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) byId.set(m.id, m);
  }
  return [...byId.values()];
}

export function recomputeMintTotals(store: Store): void {
  let confirmed = 0;
  let pending = 0;
  for (const m of store.mints) {
    if (m.status === "DUST_VALID" || m.status === "REVEAL_CONFIRMED") {
      confirmed += m.amount;
    } else if (
      m.status === "REVEAL_BROADCAST" ||
      m.status === "REVEAL_MEMPOOL" ||
      m.status === "INDEXER_PENDING"
    ) {
      pending += m.amount;
    }
  }
  store.confirmedMinted = Math.max(store.confirmedMinted, confirmed);
  store.pendingMinted = pending;
}

export function applyLedgerRows(store: Store, rows: LedgerImportRow[]): number {
  if (!rows.length) return 0;
  const records = rowsToMintRecords(rows);
  const beforeIds = new Set(store.mints.map((m) => m.id));
  store.mints = mergeMintRecords(store.mints, records);
  recomputeMintTotals(store);
  let added = 0;
  for (const m of store.mints) {
    if (!beforeIds.has(m.id)) added += 1;
  }
  return added;
}
