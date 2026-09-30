import { createHmac, timingSafeEqual } from "node:crypto";
import {
  MINT_USD,
  NETWORK,
  QUOTE_TTL_SECONDS,
  TICK,
} from "@satdust/shared";

export type ProviderPrice = {
  provider: string;
  price: number;
  timestamp: number;
};

export type SignedQuote = {
  quoteId: string;
  usd: string;
  btcUsd: string;
  feeSats: string;
  expiresAt: number;
  network: typeof NETWORK;
  signature: string;
};

export type QuoteRecord = SignedQuote & {
  providerPrices: ProviderPrice[];
  createdAt: number;
  walletAddress?: string;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/** Drop outliers more than 2% from median-of-all, then re-median. */
export function aggregateBtcUsd(prices: number[]): number {
  if (prices.length === 0) throw new Error("No BTC/USD prices");
  if (prices.length === 1) return prices[0]!;
  const m = median(prices);
  const filtered = prices.filter((p) => Math.abs(p - m) / m <= 0.02);
  const use = filtered.length > 0 ? filtered : prices;
  return Math.round(median(use) * 100) / 100;
}

export function usdToFeeSats(usd: number, btcUsd: number): number {
  if (btcUsd <= 0) throw new Error("Invalid BTC/USD");
  return Math.round((usd / btcUsd) * 100_000_000);
}

function randomId(): string {
  const hex = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
    .join("")
    .toUpperCase();
  return `${TICK}-${hex}`;
}

function payloadToSign(q: Omit<SignedQuote, "signature">): string {
  return [
    q.quoteId,
    q.usd,
    q.btcUsd,
    q.feeSats,
    String(q.expiresAt),
    q.network,
  ].join("|");
}

export function signQuote(
  unsigned: Omit<SignedQuote, "signature">,
  secret: string
): string {
  return createHmac("sha256", secret).update(payloadToSign(unsigned)).digest("hex");
}

export function verifyQuoteSignature(quote: SignedQuote, secret: string): boolean {
  const expected = signQuote(
    {
      quoteId: quote.quoteId,
      usd: quote.usd,
      btcUsd: quote.btcUsd,
      feeSats: quote.feeSats,
      expiresAt: quote.expiresAt,
      network: quote.network,
    },
    secret
  );
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(quote.signature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createSignedQuote(args: {
  btcUsd: number;
  providerPrices: ProviderPrice[];
  secret: string;
  now?: number;
  usd?: number;
  ttlSeconds?: number;
}): QuoteRecord {
  const now = args.now ?? Math.floor(Date.now() / 1000);
  const usd = args.usd ?? MINT_USD;
  const ttl = args.ttlSeconds ?? QUOTE_TTL_SECONDS;
  const feeSats = usdToFeeSats(usd, args.btcUsd);

  const unsigned: Omit<SignedQuote, "signature"> = {
    quoteId: randomId(),
    usd: usd.toFixed(2),
    btcUsd: args.btcUsd.toFixed(2),
    feeSats: String(feeSats),
    expiresAt: now + ttl,
    network: NETWORK,
  };

  const signature = signQuote(unsigned, args.secret);

  return {
    ...unsigned,
    signature,
    providerPrices: args.providerPrices,
    createdAt: now,
  };
}

export function isQuoteExpired(quote: { expiresAt: number }, now?: number): boolean {
  const t = now ?? Math.floor(Date.now() / 1000);
  return t >= quote.expiresAt;
}
