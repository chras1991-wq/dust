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

export type WalletId = "unisat" | "okx" | "xverse" | "leather" | "phantom" | "bitget";

declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
      getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
      getBitcoinUtxos?: () => Promise<
        Array<{ txid: string; vout: number; satoshis: number; scriptPk: string }>
      >;
      signPsbt: (psbtHex: string, options?: object) => Promise<string>;
      sendBitcoin?: (
        address: string,
        amount: number,
        options?: object
      ) => Promise<string>;
      pushTx?: (rawHex: string) => Promise<string>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
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
        requestAccounts: () => Promise<Array<{ address: string; publicKey?: string }>>;
        getAccounts?: () => Promise<Array<{ address: string; publicKey?: string }>>;
        signPSBT?: (psbt: string) => Promise<string>;
        sendBitcoin?: (address: string, amount: number) => Promise<string>;
      };
    };
    bitkeep?: {
      unisat?: Window["unisat"];
    };
  }
}

function mapNetwork(raw: string): Network {
  const n = raw.toLowerCase();
  if (n.includes("test")) return "testnet";
  if (n.includes("signet")) return "signet";
  if (n.includes("regtest")) return "regtest";
  return "mainnet";
}

export const unisatAdapter: BitcoinWalletAdapter = {
  id: "unisat",
  name: "UniSat",
  isAvailable() {
    if (typeof window === "undefined" || !window.unisat) return false;
    // Bitget injects the same object on window.unisat. Show it once, as Bitget.
    if (window.bitkeep?.unisat && window.unisat === window.bitkeep.unisat) return false;
    return true;
  },
  async connect() {
    if (!window.unisat) throw new Error("UniSat not installed");
    const accounts = await window.unisat.requestAccounts();
    const address = accounts[0];
    if (!address) throw new Error("No UniSat account");
    const publicKey = await window.unisat.getPublicKey();
    const network = mapNetwork(await window.unisat.getNetwork());
    return { address, publicKey, network };
  },
  async getAddress() {
    const accounts = await window.unisat!.getAccounts();
    return accounts[0]!;
  },
  async getPublicKey() {
    return window.unisat!.getPublicKey();
  },
  async getNetwork() {
    return mapNetwork(await window.unisat!.getNetwork());
  },
  async getUtxos() {
    if (!window.unisat?.getBitcoinUtxos) return [];
    const utxos = await window.unisat.getBitcoinUtxos();
    return utxos.map((u) => ({
      txid: u.txid,
      vout: u.vout,
      value: u.satoshis,
      scriptPubKey: u.scriptPk,
    }));
  },
  async signPsbt(psbt: string) {
    return window.unisat!.signPsbt(psbt, { autoFinalized: true });
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    if (!window.unisat?.sendBitcoin) {
      throw new Error("UniSat sendBitcoin unavailable — update the extension");
    }
    const sats = Math.floor(satoshis);
    return window.unisat.sendBitcoin.call(window.unisat, toAddress, sats);
  },
  async pushTx(rawHex: string) {
    if (!window.unisat?.pushTx) throw new Error("UniSat pushTx unavailable");
    return window.unisat.pushTx(rawHex);
  },
};

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
    const btc = window.okxwallet!.bitcoin!;
    try {
      return await btc.signPsbt(psbt, { autoFinalized: true });
    } catch {
      return btc.signPsbt(psbt);
    }
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    const btc = window.okxwallet?.bitcoin;
    if (!btc) throw new Error("OKX Bitcoin wallet not available");
    const sats = Math.floor(satoshis);
    if (!Number.isFinite(sats) || sats <= 0) {
      throw new Error("Invalid send amount");
    }
    if (typeof btc.sendBitcoin === "function") {
      return btc.sendBitcoin.call(btc, toAddress, sats);
    }
    const legacy = btc as {
      send?: (params: { to: string; value: string | number }) => Promise<string>;
    };
    if (typeof legacy.send === "function") {
      return legacy.send.call(btc, { to: toAddress, value: sats });
    }
    throw new Error("OKX send unavailable — update OKX Wallet or use UniSat");
  },
};

function xverseProvider(): NonNullable<Window["btc"]> | undefined {
  if (typeof window === "undefined") return undefined;
  const extra = window as Window & {
    XverseProviders?: { BitcoinProvider?: NonNullable<Window["btc"]> };
  };
  return extra.XverseProviders?.BitcoinProvider ?? window.btc;
}

export const xverseAdapter: BitcoinWalletAdapter = {
  id: "xverse",
  name: "Xverse",
  isAvailable() {
    return Boolean(xverseProvider());
  },
  async connect() {
    const provider = xverseProvider();
    if (!provider) throw new Error("Xverse not installed");
    const res = (await provider.request("getAccounts", {
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
    const provider = xverseProvider();
    if (!provider) throw new Error("Xverse not installed");
    const res = (await provider.request("signPsbt", {
      psbt,
      broadcast: false,
    })) as { result?: { psbt: string } };
    if (!res.result?.psbt) throw new Error("Xverse signPsbt failed");
    return res.result.psbt;
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    const provider = xverseProvider();
    if (!provider) throw new Error("Xverse not installed");
    const res = (await provider.request("sendTransfer", {
      recipients: [{ address: toAddress, amount: Math.floor(satoshis) }],
    })) as { result?: { txid?: string } };
    const txid = res.result?.txid;
    if (!txid) throw new Error("Xverse send failed");
    return txid;
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
    const res = (await window.LeatherProvider!.request("sendTransfer", {
      recipients: [{ address: toAddress, amount: Math.floor(satoshis) }],
      network: "mainnet",
    })) as { result?: { txid?: string } };
    const txid = res.result?.txid;
    if (!txid) throw new Error("Leather send failed");
    return txid;
  },
};

function injectedUnisatLike(
  id: WalletId,
  name: string,
  getApi: () => Window["unisat"] | undefined
): BitcoinWalletAdapter {
  return {
    id,
    name,
    isAvailable() {
      return typeof window !== "undefined" && Boolean(getApi());
    },
    async connect() {
      const api = getApi();
      if (!api) throw new Error(`${name} not installed`);
      const accounts = await api.requestAccounts();
      const address = accounts[0];
      if (!address) throw new Error(`No ${name} account`);
      const publicKey = await api.getPublicKey();
      const network = mapNetwork(await api.getNetwork());
      return { address, publicKey, network };
    },
    async getAddress() {
      const accounts = await getApi()!.getAccounts();
      return accounts[0]!;
    },
    async getPublicKey() {
      return getApi()!.getPublicKey();
    },
    async getNetwork() {
      return mapNetwork(await getApi()!.getNetwork());
    },
    async getUtxos() {
      return [];
    },
    async signPsbt(psbt: string) {
      const api = getApi()!;
      try {
        return await api.signPsbt(psbt, { autoFinalized: true });
      } catch {
        return api.signPsbt(psbt);
      }
    },
    async sendBitcoin(toAddress: string, satoshis: number) {
      const api = getApi();
      if (!api?.sendBitcoin) throw new Error(`${name} sendBitcoin unavailable`);
      return api.sendBitcoin.call(api, toAddress, Math.floor(satoshis));
    },
  };
}

export const phantomAdapter: BitcoinWalletAdapter = {
  id: "phantom",
  name: "Phantom",
  isAvailable() {
    return typeof window !== "undefined" && Boolean(window.phantom?.bitcoin);
  },
  async connect() {
    const api = window.phantom?.bitcoin;
    if (!api) throw new Error("Phantom Bitcoin wallet not installed");
    const accounts = await api.requestAccounts();
    const first = accounts[0];
    if (!first?.address) throw new Error("No Phantom Bitcoin account");
    return { address: first.address, publicKey: first.publicKey, network: "mainnet" };
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
    const api = window.phantom?.bitcoin;
    if (!api?.signPSBT) throw new Error("Phantom signPSBT unavailable");
    return api.signPSBT(psbt);
  },
  async sendBitcoin(toAddress: string, satoshis: number) {
    const api = window.phantom?.bitcoin;
    if (!api?.sendBitcoin) throw new Error("Phantom Bitcoin send unavailable — update Phantom");
    return api.sendBitcoin(toAddress, Math.floor(satoshis));
  },
};

export const bitgetAdapter = injectedUnisatLike("bitget", "Bitget Wallet", () => {
  if (typeof window === "undefined") return undefined;
  const extra = window as Window & { bitget?: { unisat?: Window["unisat"] } };
  return window.bitkeep?.unisat ?? extra.bitget?.unisat;
});

export const ALL_ADAPTERS: BitcoinWalletAdapter[] = [
  unisatAdapter,
  okxAdapter,
  xverseAdapter,
  leatherAdapter,
  phantomAdapter,
  bitgetAdapter,
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
