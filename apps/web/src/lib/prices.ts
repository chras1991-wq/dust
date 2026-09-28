import type { ProviderPrice } from "@satdust/quote";
import { aggregateBtcUsd } from "@satdust/quote";

async function fetchCoinbase(): Promise<number> {
  const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error("Coinbase price failed");
  const data = (await res.json()) as { data: { amount: string } };
  return Number(data.data.amount);
}

async function fetchKraken(): Promise<number> {
  const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", {
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error("Kraken price failed");
  const data = (await res.json()) as {
    result: { XXBTZUSD: { c: [string] } };
  };
  return Number(data.result.XXBTZUSD.c[0]);
}

async function fetchBitstamp(): Promise<number> {
  const res = await fetch("https://www.bitstamp.net/api/v2/ticker/btcusd/", {
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error("Bitstamp price failed");
  const data = (await res.json()) as { last: string };
  return Number(data.last);
}

async function safeProvider(
  name: string,
  fn: () => Promise<number>
): Promise<ProviderPrice | null> {
  try {
    const price = await fn();
    if (!Number.isFinite(price) || price <= 0) return null;
    return { provider: name, price, timestamp: Math.floor(Date.now() / 1000) };
  } catch {
    return null;
  }
}

export async function fetchBtcUsdMedian(): Promise<{
  btcUsd: number;
  providerPrices: ProviderPrice[];
}> {
  const results = await Promise.all([
    safeProvider("coinbase", fetchCoinbase),
    safeProvider("kraken", fetchKraken),
    safeProvider("bitstamp", fetchBitstamp),
  ]);

  const providerPrices = results.filter((p): p is ProviderPrice => p !== null);

  if (providerPrices.length === 0) {
    const fallback = Number(process.env.BTC_USD_FALLBACK || 100000);
    return {
      btcUsd: fallback,
      providerPrices: [
        {
          provider: "fallback",
          price: fallback,
          timestamp: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  return {
    btcUsd: aggregateBtcUsd(providerPrices.map((p) => p.price)),
    providerPrices,
  };
}

export async function estimateMinerFeeSats(): Promise<number> {
  try {
    const res = await fetch("https://mempool.space/api/v1/fees/recommended", {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error("fee estimate failed");
    const data = (await res.json()) as { halfHourFee: number };
    // Approximate commit+reveal vsize for inscription mint (~250 vB × rate)
    return Math.round(250 * data.halfHourFee);
  } catch {
    return 2500;
  }
}
