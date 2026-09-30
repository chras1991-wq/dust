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
  quantity?: number;
  onProgress?: (step: MintPayProgress) => void;
}): Promise<MintPayResult> {
  const {
    account,
    adapter,
    quoteId,
    projectFeeSats,
    revealMinerFeeSats,
    quantity = 1,
    onProgress,
  } = args;

  if (!adapter.sendBitcoin) {
    throw new Error(
      `${adapter.name} cannot send Bitcoin from this page. Use UniSat or OKX Wallet.`
    );
  }

  onProgress?.("preparing");

  const qty = Math.max(1, Math.floor(quantity));
  const unitProjectFeeSats = Math.round(projectFeeSats / qty);
  let lastMintId = "";
  let lastCommitTxid = "";
  let lastRevealTxid = "";
  let lastPlanFunding = 0;
  let lastCommitAddress = "";
  let notice =
    "Mint broadcast. Validity still depends on confirmation and indexer acceptance.";

  for (let i = 0; i < qty; i++) {
    const prepareRes = await fetch("/api/mint/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: account.address,
        publicKey: account.publicKey,
        quoteId,
        amount: 1,
      }),
    });
    const prepareData = await prepareRes.json();
    if (!prepareRes.ok) {
      throw new Error(prepareData.error || "Mint prepare failed");
    }

    const mintJson = JSON.stringify(MINT_PAYLOAD);
    const plan: MintInscribePlan = await createMintInscribePlan({
      mintJson,
      projectFeeSats: unitProjectFeeSats,
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
      revealTxid = await broadcastTx(reveal.txHex);
    }

    lastMintId = prepareData.mintId as string;
    lastCommitTxid = commitTxid;
    lastRevealTxid = revealTxid;
    lastPlanFunding = plan.fundingSats;
    lastCommitAddress = plan.commitAddress;
    notice = prepareData.notice || notice;

    await fetch("/api/mint/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mintId: lastMintId,
        commitTxid,
        revealTxid,
        amount: 1,
      }),
    });
  }

  onProgress?.("done");

  return {
    mintId: lastMintId,
    commitTxid: lastCommitTxid,
    revealTxid: lastRevealTxid,
    commitAddress: lastCommitAddress,
    fundingSats: lastPlanFunding,
    notice:
      qty > 1
        ? `${qty} mint payments broadcast. ${notice}`
        : notice,
  };
}
