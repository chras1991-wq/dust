/**
 * Ephemeral taproot commit → reveal for a DUST-20 mint inscription.
 * User funds the commit address with the wallet; reveal is signed by the
 * ephemeral key and creates the 546-sat carrier (inscription @ offset 0)
 * plus the project fee output.
 */
import * as bitcoin from "bitcoinjs-lib";
import { UNIT_SATS } from "@satdust/shared";
import { getProjectAddress } from "@satdust/shared/project";

type EccLib = {
  signSchnorr: (hash: Uint8Array, priv: Uint8Array) => Uint8Array;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type KeyPair = {
  privateKey: Buffer | undefined;
  publicKey: Buffer;
};

type ECPairAPI = {
  makeRandom: () => KeyPair;
  fromPrivateKey: (key: Buffer) => KeyPair;
};

let eccLib: EccLib | null = null;
let ECPair: ECPairAPI | null = null;

async function boot() {
  if (eccLib && ECPair) return { ecc: eccLib, ECPair };
  const eccMod = await import("@bitcoinerlab/secp256k1");
  // bitcoinerlab ships a full TinySecp256k1Interface; cast through unknown for CJS/ESM shapes
  const ecc = (eccMod.default ?? eccMod) as unknown as EccLib;
  bitcoin.initEccLib(ecc as unknown as Parameters<typeof bitcoin.initEccLib>[0]);
  const ecpairMod = await import("ecpair");
  const factory = (ecpairMod as { default?: unknown; ECPairFactory?: unknown }).default ??
    (ecpairMod as { ECPairFactory?: unknown }).ECPairFactory ??
    ecpairMod;
  const ECPairFactory = (
    typeof factory === "function"
      ? factory
      : (factory as { ECPairFactory: unknown }).ECPairFactory
  ) as (e: EccLib) => ECPairAPI;
  eccLib = ecc;
  ECPair = ECPairFactory(ecc);
  return { ecc, ECPair };
}

function toXOnly(pub: Buffer): Buffer {
  return pub.length === 33 ? pub.subarray(1, 33) : pub;
}

export function buildOrdMintScript(pubkey: Buffer, mintJson: string): Buffer {
  const content = Buffer.from(mintJson, "utf8");
  const contentType = Buffer.from("text/plain;charset=utf-8", "utf8");
  return bitcoin.script.compile([
    toXOnly(pubkey),
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_FALSE,
    bitcoin.opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    Buffer.from([1]),
    contentType,
    bitcoin.opcodes.OP_0,
    content,
    bitcoin.opcodes.OP_ENDIF,
  ]);
}

export type MintInscribePlan = {
  commitAddress: string;
  fundingSats: number;
  projectFeeSats: number;
  carrierSats: number;
  revealMinerFeeSats: number;
  mintJson: string;
  ephemeralPrivHex: string;
  internalKeyHex: string;
  leafScriptHex: string;
  controlBlockHex: string;
};

export async function createMintInscribePlan(args: {
  mintJson: string;
  projectFeeSats: number;
  revealMinerFeeSats: number;
  projectAddress?: string;
}): Promise<MintInscribePlan> {
  const expected = getProjectAddress();
  const projectAddress = args.projectAddress ?? expected;
  if (projectAddress !== expected) {
    throw new Error("ABORT: project address mismatch");
  }
  if (args.projectFeeSats <= 0) {
    throw new Error("ABORT: project fee must be positive");
  }

  const { ECPair: pairFactory } = await boot();
  const keyPair = pairFactory.makeRandom();
  if (!keyPair.privateKey) throw new Error("Failed to create ephemeral key");

  const internalPubkey = toXOnly(Buffer.from(keyPair.publicKey));
  const leafScript = buildOrdMintScript(Buffer.from(keyPair.publicKey), args.mintJson);
  const scriptTree = { output: leafScript };
  const redeem = { output: leafScript, redeemVersion: 192 };

  const payment = bitcoin.payments.p2tr({
    internalPubkey,
    scriptTree,
    redeem,
    network: bitcoin.networks.bitcoin,
  });

  if (!payment.address || !payment.output || !payment.witness?.length) {
    throw new Error("Failed to build commit address");
  }

  const controlBlock = payment.witness[payment.witness.length - 1]!;
  const revealMiner = Math.max(args.revealMinerFeeSats, 400);
  const fundingSats = UNIT_SATS + args.projectFeeSats + revealMiner;

  return {
    commitAddress: payment.address,
    fundingSats,
    projectFeeSats: args.projectFeeSats,
    carrierSats: UNIT_SATS,
    revealMinerFeeSats: revealMiner,
    mintJson: args.mintJson,
    ephemeralPrivHex: Buffer.from(keyPair.privateKey).toString("hex"),
    internalKeyHex: internalPubkey.toString("hex"),
    leafScriptHex: leafScript.toString("hex"),
    controlBlockHex: Buffer.from(controlBlock).toString("hex"),
  };
}

export async function buildAndSignRevealTx(args: {
  plan: MintInscribePlan;
  commitTxid: string;
  commitVout: number;
  commitValue: number;
  userAddress: string;
  projectAddress?: string;
}): Promise<{ txHex: string; txid: string }> {
  const expected = getProjectAddress();
  const projectAddress = args.projectAddress ?? expected;
  const { ecc, ECPair: pairFactory } = await boot();
  const keyPair = pairFactory.fromPrivateKey(
    Buffer.from(args.plan.ephemeralPrivHex, "hex")
  );
  const internalPubkey = Buffer.from(args.plan.internalKeyHex, "hex");
  const leafScript = Buffer.from(args.plan.leafScriptHex, "hex");
  const controlBlock = Buffer.from(args.plan.controlBlockHex, "hex");

  const scriptTree = { output: leafScript };
  const redeem = { output: leafScript, redeemVersion: 192 };
  const payment = bitcoin.payments.p2tr({
    internalPubkey,
    scriptTree,
    redeem,
    network: bitcoin.networks.bitcoin,
  });
  if (!payment.output) throw new Error("Invalid reveal payment");

  if (args.commitValue < UNIT_SATS + args.plan.projectFeeSats + args.plan.revealMinerFeeSats) {
    throw new Error("ABORT: commit output too small for reveal");
  }

  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
  psbt.addInput({
    hash: args.commitTxid,
    index: args.commitVout,
    witnessUtxo: { script: payment.output, value: args.commitValue },
    tapInternalKey: internalPubkey,
    tapLeafScript: [
      {
        leafVersion: 192,
        script: leafScript,
        controlBlock,
      },
    ],
  });

  psbt.addOutput({ address: args.userAddress, value: UNIT_SATS });
  psbt.addOutput({ address: projectAddress, value: args.plan.projectFeeSats });

  const leftover =
    args.commitValue - UNIT_SATS - args.plan.projectFeeSats - args.plan.revealMinerFeeSats;
  if (leftover >= 546) {
    psbt.addOutput({ address: args.userAddress, value: leftover });
  }

  const signer = {
    publicKey: Buffer.from(keyPair.publicKey),
    signSchnorr(hash: Buffer): Buffer {
      return Buffer.from(ecc.signSchnorr(hash, keyPair.privateKey!));
    },
  };

  psbt.signInput(0, signer as unknown as bitcoin.Signer);
  psbt.finalizeInput(0);
  const tx = psbt.extractTransaction();
  return { txHex: tx.toHex(), txid: tx.getId() };
}

export async function broadcastTx(txHex: string): Promise<string> {
  const res = await fetch("https://mempool.space/api/tx", {
    method: "POST",
    body: txHex,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Broadcast failed: ${text.slice(0, 180)}`);
  return text.trim();
}

/** Find the vout that paid our commit address. */
export async function findCommitUtxo(
  txid: string,
  commitAddress: string
): Promise<{ vout: number; value: number }> {
  const res = await fetch(`https://mempool.space/api/tx/${txid}`);
  if (!res.ok) throw new Error("Could not fetch commit transaction");
  const tx = (await res.json()) as {
    vout: Array<{ scriptpubkey_address?: string; value: number }>;
  };
  const idx = tx.vout.findIndex((o) => o.scriptpubkey_address === commitAddress);
  if (idx < 0) throw new Error("Commit address not found in funding tx");
  return { vout: idx, value: tx.vout[idx]!.value };
}
