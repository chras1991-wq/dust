import { createSignedQuote } from "@satdust/quote";
import { MINT_USD, PROJECT_ADDRESS } from "@satdust/shared";
import { fetchBtcUsdMedian } from "@/lib/prices";
import { getQuoteSecret } from "@/lib/server/secrets";
import { assertMintIntegrity } from "@/lib/server/integrity";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { saveQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req, "quote", 30, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();
    const { btcUsd, providerPrices } = await fetchBtcUsdMedian();
    const quote = createSignedQuote({
      btcUsd,
      providerPrices,
      secret: getQuoteSecret(),
      usd: MINT_USD,
    });
    saveQuote(quote);

    // Intentionally omit provider price list & secret material.
    return noStoreJson({
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
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Quote unavailable") },
      { status: 503 }
    );
  }
}
