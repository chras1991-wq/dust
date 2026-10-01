"use client";

import { UNIT_SATS } from "@satdust/shared";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { sweepMaxBitcoin } from "@/lib/btc-pay";
import { fetchSwapPoolAddress } from "@/lib/swap-pool-client";
import { withWalletTimeout } from "@/lib/wallet-timeout";

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
  /** Indexed leg only — on-chain BTC leg is always a full-wallet sweep. */
  const satdustAmount = Math.max(1, Math.floor(Number(args.satdustAmount) || 0));
  if (args.account.network !== "mainnet") {
    throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
  }

  const estimatedBtcSats = quoteSatdustToBtcSats(satdustAmount);
  const poolAddress = await fetchSwapPoolAddress();
  args.onProgress?.("awaiting_wallet");

  const { txid, satoshis } = await sweepMaxBitcoin({
    fromAddress: args.account.address,
    toAddress: poolAddress,
    signPsbt: (psbt) =>
      withWalletTimeout(
        args.adapter.signPsbt(psbt),
        120_000,
        `${args.adapter.name} did not open. Switch to the wallet app or extension and approve the transfer.`
      ),
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
    notice: completeData.notice ?? "Swap submitted. Settlement depends on confirmation and indexing.",
  };
}
