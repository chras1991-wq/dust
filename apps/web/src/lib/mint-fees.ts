/** Client-safe mint wallet math (matches createMintInscribePlan funding). */

import { UNIT_SATS } from "@satdust/shared";

/** Small buffer so wallet fee rate spikes do not fail reveal. */
export const REVEAL_FEE_BUFFER_SATS = 33;

export function clampRevealMinerFeeSats(estimate: number): number {
  if (!Number.isFinite(estimate) || estimate <= 0) return 450;
  return Math.min(900, Math.max(350, Math.round(estimate)));
}

/** One wallet `sendBitcoin` = carrier + project fee + reveal miner fee. */
export function mintWalletTotals(args: {
  quantity: number;
  unitProjectFeeSats: number;
  revealMinerFeeSats: number;
}) {
  const qty = Math.max(1, Math.floor(args.quantity));
  const reveal = clampRevealMinerFeeSats(args.revealMinerFeeSats);
  const perMintWallet =
    UNIT_SATS + Math.max(0, args.unitProjectFeeSats) + reveal;
  const carrierSats = UNIT_SATS * qty;
  const mintFeeSats = args.unitProjectFeeSats * qty;
  const networkSats = reveal * qty;
  const totalSats = perMintWallet * qty;

  return {
    qty,
    perMintWallet,
    carrierSats,
    mintFeeSats,
    networkSats,
    revealPerMint: reveal,
    totalSats,
  };
}
