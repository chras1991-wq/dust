import type { User } from "@privy-io/react-auth";
import type { BitcoinWalletAdapter } from "@satdust/wallet";
import { payFromPrivySegwit } from "@/lib/btc-pay";

export type PrivyBtcAccount = {
  address: string;
  publicKey: string;
};

type Walletish = {
  type?: string;
  address?: string;
  chainType?: string;
  chain_type?: string;
  publicKey?: string;
  public_key?: string;
};

function walletAccounts(user: User | null | undefined): Walletish[] {
  if (!user) return [];
  const record = user as User & { linked_accounts?: Walletish[] };
  const accounts = (record.linkedAccounts ?? record.linked_accounts ?? []) as Walletish[];
  return accounts.filter((account) => account.type === "wallet");
}

/** Native-segwit embedded wallet created through Privy. */
export function findPrivyBitcoin(user: User | null | undefined): PrivyBtcAccount | null {
  for (const account of walletAccounts(user)) {
    const chain = account.chainType ?? account.chain_type;
    if (chain !== "bitcoin-segwit") continue;
    const address = account.address ?? "";
    if (!address.startsWith("bc1")) continue;
    return {
      address,
      publicKey: account.publicKey ?? account.public_key ?? "",
    };
  }
  return null;
}

export function privyBitcoinAdapter(args: {
  address: string;
  publicKey: string;
  signHash: (hash: `0x${string}`) => Promise<`0x${string}`>;
}): BitcoinWalletAdapter {
  const account = {
    address: args.address,
    publicKey: args.publicKey,
    network: "mainnet" as const,
  };
  return {
    id: "privy",
    name: "Privy",
    isAvailable: () => true,
    async connect() {
      return account;
    },
    async getAddress() {
      return args.address;
    },
    async getPublicKey() {
      return args.publicKey;
    },
    async getNetwork() {
      return "mainnet";
    },
    async getUtxos() {
      return [];
    },
    async signPsbt() {
      throw new Error("SEND_BITCOIN_UNAVAILABLE");
    },
    async sendBitcoin(toAddress, satoshis) {
      return payFromPrivySegwit({
        fromAddress: args.address,
        publicKey: args.publicKey,
        toAddress,
        satoshis,
        signHash: args.signHash,
      });
    },
  };
}
