import { UNIT_SATS } from "@satdust/shared";

/** Signed quote `feeSats` is the full BTC payment for `usd` (all-in per token, carrier included). */
export function splitMintPaymentSats(quantity: number, quoteFeeSatsTotal: number) {
  const qty = Math.max(1, Math.floor(quantity));
  const paySats = Math.round(quoteFeeSatsTotal);
  const carrierSats = UNIT_SATS * qty;
  if (!Number.isFinite(paySats) || paySats < carrierSats) {
    throw new Error("Invalid mint quote amount");
  }
  const projectFeeSats = paySats - carrierSats;
  const unitPaySats = Math.round(paySats / qty);
  const unitProjectFeeSats = Math.round(projectFeeSats / qty);
  return {
    qty,
    paySats,
    carrierSats,
    projectFeeSats,
    unitPaySats,
    unitProjectFeeSats,
  };
}
