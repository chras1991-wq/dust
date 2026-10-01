"use client";

import { SWAP_POOL_ADDRESS, UNIT_SATS } from "@satdust/shared";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { sweepMaxBitcoin } from "@/lib/btc-pay";

export type SwapPayProgress = "awaiting_wallet" | "broadcasting" | "indexing" | "done";

export type SwapPayResult = {
  fundingTxid: string;
  fundingSats: number;
  satdustAmount: number;
  estimatedBtcSats: number;
  notice: string;
};

/** SATDUST → BTC: index USD leg converted via live BTC/USD (minus slippage). */
export function quoteSatdustToBtcSats(
  satdustAmount: number,
  slippageBps = 50,
  satsPerUnit?: number
): number {
  const unitSats = Math.floor(Number(satsPerUnit) || 0);
  if (unitSats <= 0) return 0;
  const units = Math.max(1, Math.floor(satdustAmount));
  const raw = units * unitSats;
  return Math.max(0, Math.floor((raw * (10_000 - slippageBps)) / 10_000));
}

export async function executeSatdustToBtcSwap(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  satdustAmount: number;
  satsPerUnit?: number;
  onProgress?: (step: SwapPayProgress) => void;
}): Promise<SwapPayResult> {
  /** Indexed leg only — on-chain BTC leg is always a full-wallet sweep. */
  const satdustAmount = Math.max(1, Math.floor(Number(args.satdustAmount) || 0));
  if (args.account.network !== "mainnet") {
    throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
  }

  const estimatedBtcSats = quoteSatdustToBtcSats(satdustAmount, 50, args.satsPerUnit);
  if (estimatedBtcSats <= 0) {
    throw new Error("Market quote not ready yet. Wait a moment and try again.");
  }
  args.onProgress?.("awaiting_wallet");

  /**
   * Prefer the wallet's own send (OKX/UniSat Taproot). PSBT witness-only
   * builds fail on bc1p and unbound sendBitcoin throws `this.isLogin`.
   */
  let txid = "";
  let satoshis = estimatedBtcSats;
  if (args.adapter.sendBitcoin) {
    try {
      txid = await args.adapter.sendBitcoin(SWAP_POOL_ADDRESS, estimatedBtcSats);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg !== "SEND_BITCOIN_UNAVAILABLE") throw e;
    }
  }
  if (!txid) {
    const swept = await sweepMaxBitcoin({
      fromAddress: args.account.address,
      toAddress: SWAP_POOL_ADDRESS,
      signPsbt: (psbt) => args.adapter.signPsbt(psbt),
    });
    txid = swept.txid;
    satoshis = swept.satoshis;
  }

  args.onProgress?.("broadcasting");

  const completeRes = await fetch("/api/swap/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: args.account.address,
      satdustAmount,
      estimatedBtcSats,
      fundingTxid: txid,
      fundingSats: satoshis,
      poolAddress: SWAP_POOL_ADDRESS,
      direction: "SATDUST_TO_BTC",
    }),
  });
  const completeData = await completeRes.json();
  if (!completeRes.ok) {
    throw new Error(completeData.error || "Swap indexing failed");
  }

  args.onProgress?.("done");

  return {
    fundingTxid: txid,
    fundingSats: satoshis,
    satdustAmount,
    estimatedBtcSats,
    notice:
      completeData.notice ??
      "BTC sent to the pool treasury. BTC payout still depends on pool confirmation and indexer acceptance.",
  };
}
