export type Network = "mainnet" | "testnet" | "signet" | "regtest";

export type Account = {
  address: string;
  publicKey?: string;
  network: Network;
};

export type Utxo = {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey?: string;
  /** Mark colored / inscribed UTXOs so mint funding never spends them. */
  protected?: boolean;
  labels?: Array<"ordinals" | "runes" | "dust-20" | "brc-20" | "other">;
};

export interface BitcoinWalletAdapter {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  connect(): Promise<Account>;
  disconnect?(): Promise<void>;
  getAddress(): Promise<string>;
  getPublicKey(): Promise<string>;
  getNetwork(): Promise<Network>;
  getUtxos(): Promise<Utxo[]>;
  signPsbt(psbt: string): Promise<string>;
  /** Pay sats to an address; returns funding txid when the wallet broadcasts. */
  sendBitcoin?(toAddress: string, satoshis: number): Promise<string>;
  pushTx?(rawHex: string): Promise<string>;
}

export type WalletId =
  | "privy"
  | "unisat"
  | "okx"
  | "xverse"
  | "leather"
  | "phantom"
  | "magiceden"
  | "bitget"
  | "wizz"
  | "onekey"
  | "tokenpocket"
  | "binance"
  | "bybit"
  | "gate";

type UnisatProvider = {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getPublicKey: () => Promise<string>;
  getNetwork: () => Promise<string>;
  getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
  getBitcoinUtxos?: () => Promise<
    Array<{ txid: string; vout: number; satoshis: number; scriptPk: string }>
  >;
  signPsbt: (psbtHex: string, options?: object) => Promise<string>;
  sendBitcoin?: (address: string, amount: number, options?: object) => Promise<string>;
  pushTx?: (rawHex: string) => Promise<string>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type PhantomAccount = { address: string; publicKey: string; purpose?: string };

declare global {
  interface Window {
    unisat?: UnisatProvider;
    okxwallet?: {
      bitcoin?: {
        connect: () => Promise<{ address: string; publicKey: string }>;
        getAccounts: () => Promise<string[]>;
        getPublicKey: () => Promise<string>;
        getNetwork: () => Promise<string>;
        getUtxos?: () => Promise<
          Array<{ txId: string; vout: number; satoshis: string; scriptPk?: string }>
        >;
        signPsbt: (psbtHex: string, options?: object) => Promise<string>;
        sendBitcoin?: (address: string, amount: number) => Promise<string>;
        pushTx?: (rawHex: string) => Promise<string>;
      };
    };
    btc?: {
      request: (method: string, params?: object) => Promise<unknown>;
    };
    LeatherProvider?: {
      request: (method: string, params?: object) => Promise<unknown>;
    };
    phantom?: {
      bitcoin?: {
        isPhantom?: boolean;
        requestAccounts: () => Promise<PhantomAccount[]>;
        signPSBT: (
          psbt: Uint8Array,
          options: { inputsToSign: Array<{ address: string; signingIndexes: number[] }> }
        ) => Promise<Uint8Array>;
      };
    };
    magicEden?: { bitcoin?: UnisatProvider };
    bitkeep?: { unisat?: UnisatProvider };
    bitget?: { unisat?: UnisatProvider };
    wizz?: UnisatProvider;
    $onekey?: { btc?: UnisatProvider };
    tokenpocket?: { bitcoin?: UnisatProvider };
    gatewallet?: { bitcoin?: UnisatProvider };
    binancew3w?: { bitcoin?: UnisatProvider };
    bybitWallet?: { bitcoin?: UnisatProvider };
  }
}

function mapNetwork(raw: string): Network {
  const n = raw.toLowerCase();
  if (n.includes("test")) return "testnet";
  if (n.includes("signet")) return "signet";
  if (n.includes("regtest")) return "regtest";
  return "mainnet";
}

function walletError(e: unknown, fallback: string): Error {
  if (e instanceof Error && e.message) return e;
  if (e && typeof e === "object") {
    const inner = (e as { error?: { message?: string } }).error;
    if (inner?.message) return new Error(inner.message);
    const message = (e as { message?: string }).message;
    if (message) return new Error(message);
  }
  return new Error(fallback);
}

export function readTxid(res: unknown): string {
  if (typeof res === "string" && /^[0-9a-f]{64}$/i.test(res)) return res;
  if (!res || typeof res !== "object") {
    throw new Error("Wallet did not return a transaction id");
  }
  const body = res as {
    status?: string;
    error?: { message?: string };
    txid?: string;
    txId?: string;
    result?: { txid?: string; txId?: string } | string;
  };
  if (body.status === "error") {
    throw new Error(body.error?.message || "Payment cancelled in wallet");
  }
  if (typeof body.txid === "string") return body.txid;
  if (typeof body.txId === "string") return body.txId;
  if (typeof body.result === "string" && /^[0-9a-f]{64}$/i.test(body.result)) return body.result;
  if (body.result && typeof body.result === "object") {
    if (typeof body.result.txid === "string") return body.result.txid;
    if (typeof body.result.txId === "string") return body.result.txId;
  }
  throw new Error("Wallet did not return a transaction id");
}

function unisatLike(
  id: WalletId,
  name: string,
  get: () => UnisatProvider | undefined
): BitcoinWalletAdapter {
  return {
    id,
    name,
    isAvailable() {
      return typeof window !== "undefined" && Boolean(get());
    },
    async connect() {
      const provider = get();
      if (!provider) throw new Error(`${name} is not installed`);
      try {
        const accounts = await provider.requestAccounts();
        const address = accounts[0];
        if (!address) throw new Error(`No ${name} account`);
        const publicKey = await provider.getPublicKey();
        const network = mapNetwork(await provider.getNetwork());
        return { address, publicKey, network };
      } catch (e) {
        throw walletError(e, `${name} connection failed`);
      }
    },
    async getAddress() {
      const accounts = await get()!.getAccounts();
      return accounts[0]!;
    },
    async getPublicKey() {
      return get()!.getPublicKey();
    },
    async getNetwork() {
      return mapNetwork(await get()!.getNetwork());
    },
    async getUtxos() {
      const list = get()?.getBitcoinUtxos;
      if (!list) return [];
      const utxos = await list();
      return utxos.map((u) => ({
        txid: u.txid,
        vout: u.vout,
        value: u.satoshis,
        scriptPubKey: u.scriptPk,
      }));
    },
    async signPsbt(psbt: string) {
      return get()!.signPsbt(psbt);
    },
    async sendBitcoin(toAddress: string, satoshis: number) {
      const provider = get();
      const send = provider?.sendBitcoin;
      if (!send || !provider) throw new Error("SEND_BITCOIN_UNAVAILABLE");
      return send.call(provider, toAddress, satoshis);
    },
    async pushTx(rawHex: string) {
      const push = get()?.pushTx;
      if (!push) throw new Error(`${name} pushTx unavailable`);
      return push(rawHex);
    },
  };
}

export const unisatAdapter = unisatLike("unisat", "UniSat", () =>
  typeof window === "undefined" ? undefined : window.unisat
);

export const okxAdapter: BitcoinWalletAdapter = {
  id: "okx",
  name: "OKX Wallet",
  isAvailable() {
    return typeof window !== "undefined" && Boolean(window.okxwallet?.bitcoin);
  },
  async connect() {
    const btc = window.okxwallet?.bitcoin;
    if (!btc) throw new Error("OKX Bitcoin wallet not installed");
    const res = await btc.connect();
    const network = mapNetwork(await btc.getNetwork());
    return { address: res.address, publicKey: res.publicKey, network };
  },
  async getAddress() {
    const accounts = await window.okxwallet!.bitcoin!.getAccounts();
    return accounts[0]!;
  },
  async getPublicKey() {
    return window.okxwallet!.bitcoin!.getPublicKey();
  },
  async getNetwork() {
    return mapNetwork(await window.okxwallet!.bitcoin!.getNetwork());
  },
  async getUtxos() {
    const getUtxos = window.okxwallet?.bitcoin?.getUtxos;
    if (!getUtxos) return [];
    const utxos = await getUtxos();
    return utxos.map((u) => ({
      txid: u.txId,
      vout: u.vout,
      value: Number(u.satoshis),
      scriptPubKey: u.scriptPk,
    }));
  },
  async signPsbt(psbt: string) {
    return window.okxwallet!.bitcoin!.signPsbt(psbt);
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    const btc = window.okxwallet?.bitcoin;
    const send = btc?.sendBitcoin;
    if (!send || !btc) throw new Error("SEND_BITCOIN_UNAVAILABLE");
    return send.call(btc, toAddress, satoshis);
  },
};

export const xverseAdapter: BitcoinWalletAdapter = {
  id: "xverse",
  name: "Xverse",
  isAvailable() {
    return typeof window !== "undefined" && Boolean(window.btc);
  },
  async connect() {
    if (!window.btc) throw new Error("Xverse not installed");
    const res = (await window.btc.request("getAccounts", {
      purposes: ["ordinals", "payment"],
      message: "Connect to SATDUST",
    })) as { result?: Array<{ address: string; publicKey: string; purpose: string }> };
    const accounts = res.result ?? [];
    const payment = accounts.find((a) => a.purpose === "payment") ?? accounts[0];
    if (!payment) throw new Error("No Xverse account");
    return { address: payment.address, publicKey: payment.publicKey, network: "mainnet" };
  },
  async getAddress() {
    const account = await this.connect();
    return account.address;
  },
  async getPublicKey() {
    const account = await this.connect();
    return account.publicKey ?? "";
  },
  async getNetwork() {
    return "mainnet";
  },
  async getUtxos() {
    return [];
  },
  async signPsbt(psbt: string) {
    const res = (await window.btc!.request("signPsbt", {
      psbt,
      broadcast: false,
    })) as { result?: { psbt: string } };
    if (!res.result?.psbt) throw new Error("Xverse signPsbt failed");
    return res.result.psbt;
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    if (!window.btc) throw new Error("Xverse not installed");
    try {
      const res = await window.btc.request("sendTransfer", {
        recipients: [{ address: toAddress, amount: satoshis }],
      });
      return readTxid(res);
    } catch (e) {
      throw walletError(e, "Xverse payment failed");
    }
  },
};

export const leatherAdapter: BitcoinWalletAdapter = {
  id: "leather",
  name: "Leather",
  isAvailable() {
    return typeof window !== "undefined" && Boolean(window.LeatherProvider);
  },
  async connect() {
    if (!window.LeatherProvider) throw new Error("Leather not installed");
    const res = (await window.LeatherProvider.request("getAddresses")) as {
      result?: { addresses?: Array<{ address: string; publicKey?: string; type?: string }> };
    };
    const addresses = res.result?.addresses ?? [];
    const payment =
      addresses.find((a) => a.type === "p2wpkh" || a.type === "p2tr") ?? addresses[0];
    if (!payment) throw new Error("No Leather address");
    return {
      address: payment.address,
      publicKey: payment.publicKey,
      network: "mainnet",
    };
  },
  async getAddress() {
    return (await this.connect()).address;
  },
  async getPublicKey() {
    return (await this.connect()).publicKey ?? "";
  },
  async getNetwork() {
    return "mainnet";
  },
  async getUtxos() {
    return [];
  },
  async signPsbt(psbt: string) {
    const res = (await window.LeatherProvider!.request("signPsbt", {
      hex: psbt,
    })) as { result?: { hex?: string } };
    if (!res.result?.hex) throw new Error("Leather signPsbt failed");
    return res.result.hex;
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    if (!window.LeatherProvider) throw new Error("Leather not installed");
    try {
      const res = await window.LeatherProvider.request("sendTransfer", {
        network: "mainnet",
        recipients: [{ address: toAddress, amount: String(satoshis) }],
      });
      return readTxid(res);
    } catch (e) {
      throw walletError(e, "Leather payment failed");
    }
  },
};

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/i, "");
  if (h.length % 2 !== 0) throw new Error("Bad PSBT hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readCompact(bytes: Uint8Array, offset: number): { n: number; offset: number } {
  const first = bytes[offset];
  if (first === undefined) throw new Error("Bad PSBT");
  if (first < 0xfd) return { n: first, offset: offset + 1 };
  if (first === 0xfd) {
    return { n: bytes[offset + 1]! + (bytes[offset + 2]! << 8), offset: offset + 3 };
  }
  if (first === 0xfe) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset + 1, 4);
    return { n: view.getUint32(0, true), offset: offset + 5 };
  }
  throw new Error("Bad PSBT size");
}

/** BIP-174 input count, read from the unsigned transaction in the global map. */
export function psbtInputCount(psbtHex: string): number {
  const bytes = hexToBytes(psbtHex);
  if (
    bytes[0] !== 0x70 ||
    bytes[1] !== 0x73 ||
    bytes[2] !== 0x62 ||
    bytes[3] !== 0x74 ||
    bytes[4] !== 0xff
  ) {
    throw new Error("Bad PSBT");
  }
  let offset = 5;
  let rawTx: Uint8Array | null = null;
  while (offset < bytes.length) {
    const keyLen = readCompact(bytes, offset);
    offset = keyLen.offset;
    if (keyLen.n === 0) break;
    const key = bytes.subarray(offset, offset + keyLen.n);
    offset += keyLen.n;
    const valLen = readCompact(bytes, offset);
    offset = valLen.offset;
    const value = bytes.subarray(offset, offset + valLen.n);
    offset += valLen.n;
    if (key.length === 1 && key[0] === 0x00) rawTx = value;
  }
  if (!rawTx || rawTx.length < 6) throw new Error("PSBT missing unsigned transaction");
  let cursor = 4;
  if (rawTx[4] === 0x00 && rawTx[5] === 0x01) cursor = 6;
  return readCompact(rawTx, cursor).n;
}

export const phantomAdapter: BitcoinWalletAdapter = {
  id: "phantom",
  name: "Phantom",
  isAvailable() {
    return typeof window !== "undefined" && Boolean(window.phantom?.bitcoin);
  },
  async connect() {
    const btc = window.phantom?.bitcoin;
    if (!btc) throw new Error("Phantom Bitcoin wallet not installed");
    const accounts = await btc.requestAccounts();
    const payment = accounts.find((a) => a.purpose === "payment") ?? accounts[0];
    if (!payment) throw new Error("No Phantom account");
    return { address: payment.address, publicKey: payment.publicKey, network: "mainnet" };
  },
  async getAddress() {
    return (await this.connect()).address;
  },
  async getPublicKey() {
    return (await this.connect()).publicKey ?? "";
  },
  async getNetwork() {
    return "mainnet";
  },
  async getUtxos() {
    return [];
  },
  async signPsbt(psbt: string) {
    const btc = window.phantom?.bitcoin;
    if (!btc) throw new Error("Phantom Bitcoin wallet not installed");
    const accounts = await btc.requestAccounts();
    const payment = accounts.find((a) => a.purpose === "payment") ?? accounts[0];
    if (!payment) throw new Error("No Phantom account");
    const count = psbtInputCount(psbt);
    const signed = await btc.signPSBT(hexToBytes(psbt), {
      inputsToSign: [
        { address: payment.address, signingIndexes: Array.from({ length: count }, (_, i) => i) },
      ],
    });
    return bytesToHex(signed);
  },
};

export const magicEdenAdapter = unisatLike("magiceden", "Magic Eden", () =>
  typeof window === "undefined" ? undefined : window.magicEden?.bitcoin
);
export const bitgetAdapter = unisatLike("bitget", "Bitget Wallet", () => {
  if (typeof window === "undefined") return undefined;
  return window.bitget?.unisat ?? window.bitkeep?.unisat;
});
export const wizzAdapter = unisatLike("wizz", "Wizz", () =>
  typeof window === "undefined" ? undefined : window.wizz
);
export const onekeyAdapter = unisatLike("onekey", "OneKey", () =>
  typeof window === "undefined" ? undefined : window.$onekey?.btc
);
export const tokenPocketAdapter = unisatLike("tokenpocket", "TokenPocket", () =>
  typeof window === "undefined" ? undefined : window.tokenpocket?.bitcoin
);
export const binanceAdapter = unisatLike("binance", "Binance Wallet", () =>
  typeof window === "undefined" ? undefined : window.binancew3w?.bitcoin
);
export const bybitAdapter = unisatLike("bybit", "Bybit Wallet", () =>
  typeof window === "undefined" ? undefined : window.bybitWallet?.bitcoin
);
export const gateAdapter = unisatLike("gate", "Gate Wallet", () =>
  typeof window === "undefined" ? undefined : window.gatewallet?.bitcoin
);

export const ALL_ADAPTERS: BitcoinWalletAdapter[] = [
  unisatAdapter,
  okxAdapter,
  xverseAdapter,
  leatherAdapter,
  phantomAdapter,
  magicEdenAdapter,
  bitgetAdapter,
  wizzAdapter,
  onekeyAdapter,
  tokenPocketAdapter,
  binanceAdapter,
  bybitAdapter,
  gateAdapter,
];

export function listAvailableWallets(): BitcoinWalletAdapter[] {
  return ALL_ADAPTERS.filter((a) => a.isAvailable());
}

export function getAdapter(id: WalletId): BitcoinWalletAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.id === id);
}

/** Never fund mints from colored / inscribed UTXOs. */
export function selectSafeFundingUtxos(utxos: Utxo[], needSats: number): Utxo[] {
  const safe = utxos
    .filter((u) => !u.protected && (!u.labels || u.labels.length === 0))
    .sort((a, b) => b.value - a.value);

  const selected: Utxo[] = [];
  let sum = 0;
  for (const u of safe) {
    selected.push(u);
    sum += u.value;
    if (sum >= needSats) break;
  }
  if (sum < needSats) {
    throw new Error(`Insufficient safe UTXOs: need ${needSats} sats, have ${sum}`);
  }
  return selected;
}
