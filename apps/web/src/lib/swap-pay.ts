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
  notice: string;
};

/** BTC sats → SATDUST units at the live index price (minus slippage). */
export function quoteBtcSatsToSatdust(
  sats: number,
  slippageBps = 50,
  satsPerUnit?: number
): number {
  const unitSats = Math.floor(Number(satsPerUnit) || 0);
  if (unitSats <= 0 || sats <= 0) return 0;
  const net = Math.floor((sats * (10_000 - slippageBps)) / 10_000);
  return Math.floor((net / unitSats) * 10_000) / 10_000;
}

async function payPool(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  /** Exact sats to send. Omit to sweep every confirmed coin. */
  satoshis?: number;
}): Promise<{ txid: string; satoshis: number }> {
  if (args.satoshis && args.satoshis > 0 && args.adapter.sendBitcoin) {
    const txid = await args.adapter.sendBitcoin(SWAP_POOL_ADDRESS, args.satoshis);
    return { txid, satoshis: args.satoshis };
  }
  return sweepMaxBitcoin({
    fromAddress: args.account.address,
    toAddress: SWAP_POOL_ADDRESS,
    signPsbt: (psbt) => args.adapter.signPsbt(psbt),
    sendBitcoin: args.adapter.sendBitcoin
      ? (to, sats) => args.adapter.sendBitcoin!(to, sats)
      : undefined,
  });
}
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

  const paid = await payPool({
    account: args.account,
    adapter: args.adapter,
    satoshis: estimatedBtcSats,
  });
  const txid = paid.txid;
  const satoshis = paid.satoshis;

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
      "BTC sent to the pool treasury.",
  };
}

/** BTC → SATDUST: send every confirmed sat (minus miner fee) to the pool. */
export async function executeBtcToSatdustSwap(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  satsPerUnit?: number;
  onProgress?: (step: SwapPayProgress) => void;
}): Promise<SwapPayResult> {
  if (args.account.network !== "mainnet") {
    throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
  }
  if (!args.satsPerUnit || args.satsPerUnit <= 0) {
    throw new Error("Market quote not ready yet. Wait a moment and try again.");
  }

  args.onProgress?.("awaiting_wallet");
  const paid = await payPool({ account: args.account, adapter: args.adapter });
  const satdustAmount = quoteBtcSatsToSatdust(paid.satoshis, 50, args.satsPerUnit);
  if (satdustAmount <= 0) {
    throw new Error("Payment was too small to credit SATDUST.");
  }

  args.onProgress?.("broadcasting");
  const completeRes = await fetch("/api/swap/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: args.account.address,
      satdustAmount,
      estimatedBtcSats: paid.satoshis,
      fundingTxid: paid.txid,
      fundingSats: paid.satoshis,
      poolAddress: SWAP_POOL_ADDRESS,
      direction: "BTC_TO_SATDUST",
    }),
  });
  const completeData = await completeRes.json();
  if (!completeRes.ok) {
    throw new Error(completeData.error || "Swap indexing failed");
  }

  args.onProgress?.("done");
  return {
    fundingTxid: paid.txid,
    fundingSats: paid.satoshis,
    satdustAmount,
    estimatedBtcSats: paid.satoshis,
    notice:
      completeData.notice ??
      `Sent ${(paid.satoshis / 1e8).toFixed(8)} BTC. Indexed ${satdustAmount} SATDUST.`,
  };
}
