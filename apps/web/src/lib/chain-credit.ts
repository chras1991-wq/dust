import { VIRTUAL_PROGRESS_START_MS } from "./virtual-progress";

/** How far a chain payment may drift from N × the $1 quote and still credit N. */
const PAYMENT_DRIFT = 0.012;

/** Ignore transfers from before this mint window. */
const CREDIT_FROM_SEC = Math.floor(VIRTUAL_PROGRESS_START_MS / 1000);

/**
 * Nearest whole SATDUST count for a payment that already landed on the project address.
 * Returns 0 when the amount is not a mint (dust, unrelated transfer, or too far from the quote).
 */
export function creditQtyForPayment(paidSats: number, unitSats: number): number {
  if (!Number.isFinite(paidSats) || !Number.isFinite(unitSats)) return 0;
  const paid = Math.round(paidSats);
  const unit = Math.round(unitSats);
  if (paid <= 0 || unit <= 0) return 0;
  const qty = Math.round(paid / unit);
  if (qty < 1 || qty > 100_000) return 0;
  const expected = qty * unit;
  const drift = Math.abs(paid - expected);
  if (drift / paid > PAYMENT_DRIFT) return 0;
  return qty;
}

export type MempoolTxLike = {
  txid?: string;
  status?: { confirmed?: boolean; block_time?: number };
  vin?: { prevout?: { scriptpubkey_address?: string; value?: number } }[];
  vout?: { scriptpubkey_address?: string; value?: number }[];
};

export type ChainPayment = {
  txid: string;
  paidSats: number;
  seenAt: number;
};

/**
 * Payments from `address` to the project address.
 * The wallet must be an input. Receiving change, or a transfer the project itself sent, does not count.
 */
export function projectPaymentsFromTxs(args: {
  address: string;
  projectAddress: string;
  txs: MempoolTxLike[];
  nowSec: number;
}): ChainPayment[] {
  const wallet = args.address.trim().toLowerCase();
  const project = args.projectAddress.trim().toLowerCase();
  if (!wallet || !project || wallet === project) return [];

  const out: ChainPayment[] = [];
  const seen = new Set<string>();

  for (const tx of args.txs) {
    const txid = (tx.txid ?? "").toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(txid) || seen.has(txid)) continue;

    const payers = new Set<string>();
    for (const vin of tx.vin ?? []) {
      const addr = vin.prevout?.scriptpubkey_address?.trim().toLowerCase();
      if (addr) payers.add(addr);
    }
    if (!payers.has(wallet)) continue;

    const external = [...payers].filter((addr) => addr !== project);
    if (external.length !== 1 || external[0] !== wallet) continue;

    let paidSats = 0;
    for (const vout of tx.vout ?? []) {
      const addr = vout.scriptpubkey_address?.trim().toLowerCase();
      if (addr === project && typeof vout.value === "number" && vout.value > 0) {
        paidSats += vout.value;
      }
    }
    if (paidSats <= 0) continue;

    const blockTime = tx.status?.block_time;
    const seenAt =
      typeof blockTime === "number" && blockTime > 0 ? blockTime : args.nowSec;
    if (seenAt < CREDIT_FROM_SEC) continue;

    seen.add(txid);
    out.push({ txid, paidSats, seenAt });
  }

  return out;
}
