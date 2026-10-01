"use client";

import { SWAP_POOL_ADDRESS } from "@satdust/shared";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { sweepMaxBitcoin } from "@/lib/btc-pay";

export type SwapPayProgress = "awaiting_wallet" | "broadcasting" | "indexing" | "done";

export type SwapPayResult = {
  fundingTxid: string;
  fundingSats: number;
  satdustAmount: number;
  estimatedBtcSats: number;
};

export function quoteUnitsToBtcSats(
  satdustAmount: number,
  satsPerUnit: number,
  slippageBps = 35
): number {
  const units = Math.max(1, Math.floor(satdustAmount));
  const raw = units * Math.max(546, Math.floor(satsPerUnit));
  return Math.max(0, Math.floor((raw * (10_000 - slippageBps)) / 10_000));
}

export async function executeIndexSwap(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  satdustAmount: number;
  satsPerUnit: number;
  onProgress?: (step: SwapPayProgress) => void;
}): Promise<SwapPayResult> {
  const satdustAmount = Math.max(1, Math.floor(Number(args.satdustAmount) || 0));
  if (args.account.network !== "mainnet") {
    throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
  }

  const estimatedBtcSats = quoteUnitsToBtcSats(satdustAmount, args.satsPerUnit);
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
    throw new Error(completeData.error || "Request failed");
  }

  args.onProgress?.("done");

  return {
    fundingTxid: txid,
    fundingSats: satoshis,
    satdustAmount,
    estimatedBtcSats,
  };
}
