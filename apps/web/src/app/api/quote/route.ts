import { NextResponse } from "next/server";
import { createSignedQuote } from "@satdust/quote";
import { MINT_USD, PROJECT_ADDRESS } from "@satdust/shared";
import { fetchBtcUsdMedian } from "@/lib/prices";
import { getQuoteSecret } from "@/lib/site";
import { saveQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const { btcUsd, providerPrices } = await fetchBtcUsdMedian();
  const quote = createSignedQuote({
    btcUsd,
    providerPrices,
    secret: getQuoteSecret(),
    usd: MINT_USD,
  });
  saveQuote(quote);

  return NextResponse.json({
    quoteId: quote.quoteId,
    usd: quote.usd,
    btcUsd: quote.btcUsd,
    feeSats: quote.feeSats,
    expiresAt: quote.expiresAt,
    network: quote.network,
    signature: quote.signature,
    projectAddress: PROJECT_ADDRESS,
    providerCount: providerPrices.length,
  });
}
