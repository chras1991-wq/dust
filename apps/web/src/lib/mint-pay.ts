"use client";

import {
  broadcastTx,
  buildAndSignRevealTx,
  createMintInscribePlan,
  findCommitUtxo,
  type MintInscribePlan,
} from "@satdust/bitcoin";
import { MINT_PAYLOAD } from "@satdust/shared";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";

export type MintPayProgress =
  | "preparing"
  | "awaiting_wallet"
  | "funding"
  | "revealing"
  | "broadcasting"
  | "done";

export type MintPayResult = {
  mintId: string;
  commitTxid: string;
  revealTxid: string;
  commitAddress: string;
  fundingSats: number;
  notice: string;
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForCommitUtxo(txid: string, commitAddress: string) {
  let lastErr: unknown;
  for (let i = 0; i < 12; i++) {
    try {
      return await findCommitUtxo(txid, commitAddress);
    } catch (e) {
      lastErr = e;
      await sleep(1500);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Timed out waiting for funding transaction");
}

/**
 * Full mint payment: wallet funds commit → reveal inscription + project fee.
 */
export async function executeMintPayment(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  quoteId: string;
  projectFeeSats: number;
  revealMinerFeeSats: number;
  onProgress?: (step: MintPayProgress) => void;
}): Promise<MintPayResult> {
  const { account, adapter, quoteId, projectFeeSats, revealMinerFeeSats, onProgress } =
    args;

  if (!adapter.sendBitcoin) {
    throw new Error(
      `${adapter.name} cannot send Bitcoin from this page. Use UniSat or OKX Wallet.`
    );
  }

  onProgress?.("preparing");

  const prepareRes = await fetch("/api/mint/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: account.address,
      publicKey: account.publicKey,
      quoteId,
    }),
  });
  const prepareData = await prepareRes.json();
  if (!prepareRes.ok) {
    throw new Error(prepareData.error || "Mint prepare failed");
  }

  const mintJson = JSON.stringify(MINT_PAYLOAD);
  const plan: MintInscribePlan = await createMintInscribePlan({
    mintJson,
    projectFeeSats,
    revealMinerFeeSats,
  });

  onProgress?.("awaiting_wallet");
  let commitTxid: string;
  try {
    commitTxid = await adapter.sendBitcoin(plan.commitAddress, plan.fundingSats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Wallet payment failed";
    if (/reject|cancel|denied/i.test(msg)) {
      throw new Error("Payment cancelled in wallet");
    }
    throw new Error(msg);
  }

  onProgress?.("funding");
  const utxo = await waitForCommitUtxo(commitTxid, plan.commitAddress);

  onProgress?.("revealing");
  const reveal = await buildAndSignRevealTx({
    plan,
    commitTxid,
    commitVout: utxo.vout,
    commitValue: utxo.value,
    userAddress: account.address,
  });

  onProgress?.("broadcasting");
  let revealTxid = reveal.txid;
  try {
    if (adapter.pushTx) {
      revealTxid = await adapter.pushTx(reveal.txHex);
    } else {
      revealTxid = await broadcastTx(reveal.txHex);
    }
  } catch {
    // Fallback to public broadcaster if wallet push fails
    revealTxid = await broadcastTx(reveal.txHex);
  }

  onProgress?.("done");

  return {
    mintId: prepareData.mintId as string,
    commitTxid,
    revealTxid,
    commitAddress: plan.commitAddress,
    fundingSats: plan.fundingSats,
    notice:
      prepareData.notice ||
      "Mint broadcast. Validity still depends on confirmation and indexer acceptance.",
  };
}
