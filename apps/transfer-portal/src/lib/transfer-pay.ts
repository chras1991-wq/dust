"use client";

import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { readTxid } from "@satdust/wallet";

export type TransferLot = {
  mintId: string;
  amount: number;
  inscriptionId: string | null;
  revealTxid: string | null;
  carrierSats: number;
  status: string;
};

export type TransferPayProgress = "selecting" | "awaiting_wallet" | "broadcasting" | "done";

export type TransferPayResult = {
  txids: string[];
  satdustAmount: number;
  recipient: string;
  notice: string;
};

type UnisatInscriptionApi = {
  sendInscription?: (inscriptionId: string, toAddress: string) => Promise<string>;
  getInscriptions?: (
    cursor: number,
    size: number
  ) => Promise<{
    list?: Array<{
      inscriptionId: string;
      outputValue?: number;
      contentBody?: string;
      content?: string;
    }>;
  }>;
};

function unisatProviderForAdapter(adapterId: string): UnisatInscriptionApi | undefined {
  if (typeof window === "undefined") return undefined;
  const unisatLikeIds = new Set([
    "unisat",
    "okx",
    "magiceden",
    "bitget",
    "wizz",
    "onekey",
    "tokenpocket",
    "binance",
    "bybit",
    "gate",
  ]);
  if (!unisatLikeIds.has(adapterId)) return undefined;
  return (
    window.unisat ??
    window.okxwallet?.bitcoin ??
    window.magicEden?.bitcoin ??
    window.bitget?.unisat ??
    window.bitkeep?.unisat ??
    window.wizz ??
    window.$onekey?.btc ??
    window.tokenpocket?.bitcoin ??
    window.binancew3w?.bitcoin ??
    window.bybitWallet?.bitcoin ??
    window.gatewallet?.bitcoin
  ) as UnisatInscriptionApi | undefined;
}

function looksLikeSatdust(content: string | undefined): boolean {
  if (!content) return false;
  const body = content.toLowerCase();
  return body.includes("dust-20") && body.includes("satdust");
}

/** Read SATDUST carrier inscriptions directly from a connected UniSat-style wallet. */
export async function loadWalletInscriptionLots(
  adapter: BitcoinWalletAdapter
): Promise<TransferLot[]> {
  const provider = unisatProviderForAdapter(adapter.id);
  const getInscriptions = provider?.getInscriptions;
  if (!getInscriptions) return [];
  const page = await getInscriptions(0, 100);
  const list = page.list ?? [];
  return list
    .filter((row) => looksLikeSatdust(row.contentBody ?? row.content))
    .map((row) => ({
      mintId: `wallet-${row.inscriptionId}`,
      amount: 1,
      inscriptionId: row.inscriptionId,
      revealTxid: null,
      carrierSats: row.outputValue ?? 546,
      status: "WALLET_INSCRIPTION",
    }))
    .filter((row) => Boolean(row.inscriptionId));
}

function isValidRecipient(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address.trim());
}

function selectLots(lots: TransferLot[], amount: number): TransferLot[] {
  const need = Math.max(1, Math.floor(amount));
  const sorted = [...lots].sort((a, b) => a.amount - b.amount);
  const picked: TransferLot[] = [];
  let sum = 0;
  for (const lot of sorted) {
    if (!lot.inscriptionId) continue;
    picked.push(lot);
    sum += lot.amount;
    if (sum >= need) break;
  }
  if (sum < need) {
    throw new Error(`Not enough indexed SATDUST to send ${need} (available ${sum}).`);
  }
  return picked;
}

async function sendOneInscription(args: {
  adapter: BitcoinWalletAdapter;
  inscriptionId: string;
  toAddress: string;
}): Promise<string> {
  const { adapter, inscriptionId, toAddress } = args;

  if (adapter.id === "xverse" && typeof window !== "undefined" && window.btc) {
    const res = await window.btc.request("sendInscription", {
      inscriptionId,
      recipientAddress: toAddress,
    });
    return readTxid(res);
  }

  const unisatLikeIds = new Set([
    "unisat",
    "okx",
    "magiceden",
    "bitget",
    "wizz",
    "onekey",
    "tokenpocket",
    "binance",
    "bybit",
    "gate",
  ]);

  if (unisatLikeIds.has(adapter.id) && typeof window !== "undefined") {
    const provider = unisatProviderForAdapter(adapter.id);
    const send = provider?.sendInscription;
    if (send) {
      return send.call(provider, inscriptionId, toAddress);
    }
  }

  throw new Error(
    "This wallet cannot send inscriptions here. Connect UniSat, Xverse, OKX, or another inscription-capable Bitcoin wallet."
  );
}

export async function executeSatdustTransfer(args: {
  account: Account;
  adapter: BitcoinWalletAdapter;
  recipient: string;
  satdustAmount: number;
  lots: TransferLot[];
  onProgress?: (step: TransferPayProgress) => void;
}): Promise<TransferPayResult> {
  const recipient = args.recipient.trim();
  if (!isValidRecipient(recipient)) {
    throw new Error("Enter a valid mainnet bc1 recipient address.");
  }
  if (recipient.toLowerCase() === args.account.address.toLowerCase()) {
    throw new Error("Recipient must differ from your connected address.");
  }
  if (args.account.network !== "mainnet") {
    throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
  }

  const satdustAmount = Math.max(1, Math.floor(Number(args.satdustAmount) || 0));
  args.onProgress?.("selecting");
  const picked = selectLots(args.lots, satdustAmount);

  const txids: string[] = [];
  args.onProgress?.("awaiting_wallet");

  for (const lot of picked) {
    if (!lot.inscriptionId) continue;
    args.onProgress?.("broadcasting");
    const txid = await sendOneInscription({
      adapter: args.adapter,
      inscriptionId: lot.inscriptionId,
      toAddress: recipient,
    });
    txids.push(txid);
  }

  if (txids.length === 0) {
    throw new Error("No transferable inscriptions were found for this wallet.");
  }

  args.onProgress?.("done");

  return {
    txids,
    satdustAmount,
    recipient,
    notice:
      "Transfer broadcast on Bitcoin mainnet. SATDUST moves with the carrier UTXO; indexers may take a few blocks to show the new owner.",
  };
}
