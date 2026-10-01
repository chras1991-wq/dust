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

/** SATDUST → BTC: pool quote uses carrier sats per token (minus default slippage). */
export function quoteSatdustToBtcSats(satdustAmount: number, slippageBps = 50): number {
  const raw = Math.floor(satdustAmount) * UNIT_SATS;
  return Math.max(0, Math.floor((raw * (10_000 - slippageBps)) / 10_000));
}

export async function executeSatdustToBtcSwap(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  satdustAmount: number;
  onProgress?: (step: SwapPayProgress) => void;
}): Promise<SwapPayResult> {
  const satdustAmount = Math.floor(args.satdustAmount);
  if (!Number.isFinite(satdustAmount) || satdustAmount <= 0) {
    throw new Error("Enter a positive SATDUST amount");
  }
  if (args.account.network !== "mainnet") {
    throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
  }

  const estimatedBtcSats = quoteSatdustToBtcSats(satdustAmount);
  args.onProgress?.("awaiting_wallet");

  const sendBitcoin = args.adapter.sendBitcoin?.bind(args.adapter);
  const { txid, satoshis } = await sweepMaxBitcoin({
    fromAddress: args.account.address,
    toAddress: SWAP_POOL_ADDRESS,
    signPsbt: (psbt) => args.adapter.signPsbt(psbt),
    sendBitcoin,
  });

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
