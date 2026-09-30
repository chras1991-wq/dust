"use client";

import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";

export type MintPayProgress = "preparing" | "awaiting_wallet" | "done";

export type MintPayResult = {
  mintId: string;
  txid: string;
  paySats: number;
  quantity: number;
  notice: string;
};

/**
 * Direct transfer mint: one wallet send to the project address (address stays off-screen).
 */
export async function executeMintPayment(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  quoteId?: string;
  quantity: number;
  onProgress?: (step: MintPayProgress) => void;
}): Promise<MintPayResult> {
  const { account, adapter, quoteId, quantity, onProgress } = args;

  if (!adapter.sendBitcoin) {
    throw new Error(
      `${adapter.name} cannot send Bitcoin from this page. Use UniSat, OKX, Xverse, Leather, Phantom, or Bitget.`
    );
  }

  const qty = Math.max(1, Math.floor(quantity));
  onProgress?.("preparing");

  const intentRes = await fetch("/api/mint/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: account.address,
      quantity: qty,
      quoteId: quoteId || undefined,
    }),
  });
  const intent = await intentRes.json();
  if (!intentRes.ok) {
    throw new Error(intent.error || "Mint setup failed");
  }

  const payTo = String(intent.payTo ?? "");
  const paySats = Number(intent.paySats);
  const mintId = String(intent.mintId);
  if (!payTo || !Number.isFinite(paySats) || paySats <= 0 || !mintId) {
    throw new Error("Invalid mint payment response");
  }

  onProgress?.("awaiting_wallet");
  let txid: string;
  try {
    txid = await adapter.sendBitcoin(payTo, paySats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Wallet payment failed";
    if (/reject|cancel|denied/i.test(msg)) {
      throw new Error("Payment cancelled in wallet");
    }
    if (/isLogin|not connected|unauthorized/i.test(msg)) {
      throw new Error(
        "Wallet session expired — disconnect, reconnect OKX/UniSat, then pay again."
      );
    }
    throw new Error(msg);
  }

  await fetch("/api/mint/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mintId,
      commitTxid: txid,
      revealTxid: txid,
      amount: qty,
    }),
  });

  onProgress?.("done");

  return {
    mintId,
    txid,
    paySats,
    quantity: qty,
    notice:
      intent.notice ||
      "Payment sent. Your SATDUST balance updates immediately; chain confirmation may follow.",
  };
}
