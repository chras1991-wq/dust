import { broadcastTx, planSegwitSpend, type SpendCoin } from "@satdust/bitcoin";
import * as bitcoin from "bitcoinjs-lib";

const CURVE_N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
const HALF_N = CURVE_N >> BigInt(1);

let eccReady = false;
let compressPoint: ((point: Uint8Array, compressed?: boolean) => Uint8Array) | null = null;

async function bootEcc() {
  if (eccReady && compressPoint) return;
  const eccMod = await import("@bitcoinerlab/secp256k1");
  const lib = (eccMod.default ?? eccMod) as unknown as {
    pointCompress: (point: Uint8Array, compressed?: boolean) => Uint8Array;
  };
  bitcoin.initEccLib(lib as unknown as Parameters<typeof bitcoin.initEccLib>[0]);
  compressPoint = lib.pointCompress.bind(lib);
  eccReady = true;
}

type MempoolUtxo = {
  txid: string;
  vout: number;
  value: number;
  status?: { confirmed?: boolean };
};

export async function fetchConfirmedBtcSats(address: string): Promise<number> {
  const coins = await loadSpendableCoins(address);
  return coins.reduce((sum, coin) => sum + coin.value, 0);
}

function planAddressSweep(
  coins: SpendCoin[],
  feeRate: number,
  fromAddress: string
): { inputs: SpendCoin[]; amount: number; fee: number } {
  const inputs = coins
    .filter((c) => Number.isInteger(c.value) && c.value > 0)
    .sort((a, b) => b.value - a.value);
  if (inputs.length === 0) throw new Error("No spendable bitcoin in this wallet yet");
  const total = inputs.reduce((sum, coin) => sum + coin.value, 0);
  const fee = sweepVbytes(inputs.length, 1, fromAddress) * feeRate;
  const amount = total - fee;
  if (!Number.isInteger(amount) || amount < 546) {
    throw new Error("Insufficient bitcoin to cover network fee");
  }
  return { inputs, amount, fee };
}

async function loadSpendableCoins(address: string): Promise<SpendCoin[]> {
  const res = await fetch(`https://mempool.space/api/address/${encodeURIComponent(address)}/utxo`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not read bitcoin in this wallet");
  const rows = (await res.json()) as MempoolUtxo[];
  const coins = rows
    .filter((row) => Number.isInteger(row.value) && row.value > 0)
    .map((row) => ({ txid: row.txid, vout: row.vout, value: row.value }));
  if (coins.length === 0) throw new Error("No spendable bitcoin in this wallet yet");
  return coins;
}

function inputVbytes(fromAddress: string): number {
  const a = fromAddress.toLowerCase();
  if (a.startsWith("bc1p")) return 58;
  return 68;
}

function sweepVbytes(inputs: number, outputs: number, fromAddress: string): number {
  return Math.ceil(10.5 + inputs * inputVbytes(fromAddress) + outputs * 31);
}

async function loadFeeRate(): Promise<number> {
  try {
    const res = await fetch("https://mempool.space/api/v1/fees/recommended");
    if (!res.ok) return 5;
    const data = (await res.json()) as { halfHourFee?: number };
    const rate = Math.ceil(Number(data.halfHourFee));
    return Number.isFinite(rate) && rate > 0 ? rate : 5;
  } catch {
    return 5;
  }
}

function buildSweepPsbt(args: {
  fromAddress: string;
  toAddress: string;
  coins: SpendCoin[];
  feeRate: number;
}): { psbt: bitcoin.Psbt; inputCount: number; satoshis: number } {
  const plan = planAddressSweep(args.coins, args.feeRate, args.fromAddress);
  const network = bitcoin.networks.bitcoin;
  const script = bitcoin.address.toOutputScript(args.fromAddress, network);
  const psbt = new bitcoin.Psbt({ network });
  for (const input of plan.inputs) {
    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      witnessUtxo: { script, value: input.value },
    });
  }
  psbt.addOutput({ address: args.toAddress, value: plan.amount });
  return { psbt, inputCount: plan.inputs.length, satoshis: plan.amount };
}

function buildPaymentPsbt(args: {
  fromAddress: string;
  toAddress: string;
  satoshis: number;
  coins: SpendCoin[];
  feeRate: number;
}): { psbt: bitcoin.Psbt; inputCount: number } {
  const plan = planSegwitSpend(args.coins, args.satoshis, args.feeRate);
  const network = bitcoin.networks.bitcoin;
  const script = bitcoin.address.toOutputScript(args.fromAddress, network);
  const psbt = new bitcoin.Psbt({ network });
  for (const input of plan.inputs) {
    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      witnessUtxo: { script, value: input.value },
    });
  }
  psbt.addOutput({ address: args.toAddress, value: args.satoshis });
  if (plan.change > 0) psbt.addOutput({ address: args.fromAddress, value: plan.change });
  return { psbt, inputCount: plan.inputs.length };
}

function psbtFromSigned(signed: string): bitcoin.Psbt {
  const compact = signed.trim();
  const network = bitcoin.networks.bitcoin;
  try {
    return bitcoin.Psbt.fromHex(compact, { network });
  } catch {
    return bitcoin.Psbt.fromBase64(compact, { network });
  }
}

/** Wallet returns a signed PSBT; we finalize and broadcast. */
export async function payFromSignedPsbt(args: {
  fromAddress: string;
  toAddress: string;
  satoshis: number;
  signPsbt: (psbtHex: string) => Promise<string>;
}): Promise<string> {
  await bootEcc();
  const coins = await loadSpendableCoins(args.fromAddress);
  const { psbt } = buildPaymentPsbt({ ...args, coins, feeRate: await loadFeeRate() });
  const signed = await args.signPsbt(psbt.toHex());
  if (/^[0-9a-f]+$/i.test(signed.trim()) && !signed.trim().toLowerCase().startsWith("70736274")) {
    return broadcastTx(signed.trim());
  }
  const finalized = psbtFromSigned(signed);
  finalized.finalizeAllInputs();
  return broadcastTx(finalized.extractTransaction().toHex());
}

function readCompactSig(signature: string): Uint8Array {
  const hex = signature.trim().replace(/^0x/i, "");
  const bytes = Uint8Array.from(Buffer.from(hex, "hex"));
  const raw = bytes.length >= 64 ? bytes.subarray(0, 64) : bytes;
  if (raw.length !== 64) throw new Error("Wallet returned an unexpected signature");
  let s = BigInt(0);
  for (const byte of raw.subarray(32)) s = (s << BigInt(8)) + BigInt(byte);
  if (s <= HALF_N) return raw;
  const flipped = new Uint8Array(raw);
  let next = CURVE_N - s;
  for (let i = 31; i >= 0; i--) {
    flipped[32 + i] = Number(next & BigInt(255));
    next >>= BigInt(8);
  }
  return flipped;
}

function compressedPubkey(publicKey: string): Buffer {
  const hex = publicKey.trim().replace(/^0x/i, "");
  const bytes = Buffer.from(hex, "hex");
  if (bytes.length === 33) return bytes;
  if (bytes.length === 65 && compressPoint) return Buffer.from(compressPoint(bytes, true));
  throw new Error("This Bitcoin wallet is missing a public key. Disconnect and connect again.");
}

/** Sign a native-segwit spend with Privy's raw-hash API and broadcast it. */
export async function payFromPrivySegwit(args: {
  fromAddress: string;
  publicKey: string;
  toAddress: string;
  satoshis: number;
  signHash: (hash: `0x${string}`) => Promise<`0x${string}`>;
}): Promise<string> {
  await bootEcc();
  const pubkey = compressedPubkey(args.publicKey);
  const network = bitcoin.networks.bitcoin;
  const derived = bitcoin.payments.p2wpkh({ pubkey, network });
  if (derived.address !== args.fromAddress) {
    throw new Error("Bitcoin public key does not match this address");
  }
  const coins = await loadSpendableCoins(args.fromAddress);
  const { psbt, inputCount } = buildPaymentPsbt({
    fromAddress: args.fromAddress,
    toAddress: args.toAddress,
    satoshis: args.satoshis,
    coins,
    feeRate: await loadFeeRate(),
  });
  const signer = {
    publicKey: pubkey,
    sign(hash: Buffer) {
      const hex = `0x${hash.toString("hex")}` as `0x${string}`;
      return args.signHash(hex).then((signature) => Buffer.from(readCompactSig(signature)));
    },
  };
  for (let i = 0; i < inputCount; i++) {
    await psbt.signInputAsync(i, signer as unknown as bitcoin.Signer);
  }
  psbt.finalizeAllInputs();
  return broadcastTx(psbt.extractTransaction().toHex());
}

/** Spend all spendable coins at `fromAddress` (minus fee) to one address via PSBT. */
export async function sweepMaxBitcoin(args: {
  fromAddress: string;
  toAddress: string;
  signPsbt: (psbtHex: string) => Promise<string>;
}): Promise<{ txid: string; satoshis: number }> {
  await bootEcc();
  const coins = await loadSpendableCoins(args.fromAddress);
  const feeRate = await loadFeeRate();
  const { psbt, satoshis } = buildSweepPsbt({
    fromAddress: args.fromAddress,
    toAddress: args.toAddress,
    coins,
    feeRate,
  });
  const signed = await args.signPsbt(psbt.toHex());
  if (/^[0-9a-f]+$/i.test(signed.trim()) && !signed.trim().toLowerCase().startsWith("70736274")) {
    return { txid: await broadcastTx(signed.trim()), satoshis };
  }
  const finalized = psbtFromSigned(signed);
  finalized.finalizeAllInputs();
  return { txid: await broadcastTx(finalized.extractTransaction().toHex()), satoshis };
}

/** Sign a full-wallet sweep with Privy's raw-hash API and broadcast it. */
export async function sweepMaxFromPrivySegwit(args: {
  fromAddress: string;
  publicKey: string;
  toAddress: string;
  signHash: (hash: `0x${string}`) => Promise<`0x${string}`>;
}): Promise<{ txid: string; satoshis: number }> {
  await bootEcc();
  const pubkey = compressedPubkey(args.publicKey);
  const network = bitcoin.networks.bitcoin;
  const derived = bitcoin.payments.p2wpkh({ pubkey, network });
  if (derived.address !== args.fromAddress) {
    throw new Error("Bitcoin public key does not match this address");
  }
  const coins = await loadSpendableCoins(args.fromAddress);
  const feeRate = await loadFeeRate();
  const { psbt, inputCount, satoshis } = buildSweepPsbt({
    fromAddress: args.fromAddress,
    toAddress: args.toAddress,
    coins,
    feeRate,
  });
  const signer = {
    publicKey: pubkey,
    sign(hash: Buffer) {
      const hex = `0x${hash.toString("hex")}` as `0x${string}`;
      return args.signHash(hex).then((signature) => Buffer.from(readCompactSig(signature)));
    },
  };
  for (let i = 0; i < inputCount; i++) {
    await psbt.signInputAsync(i, signer as unknown as bitcoin.Signer);
  }
  psbt.finalizeAllInputs();
  return { txid: await broadcastTx(psbt.extractTransaction().toHex()), satoshis };
}
