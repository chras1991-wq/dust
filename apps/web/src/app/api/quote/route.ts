import { createSignedQuote } from "@satdust/quote";
import { MINT_USD, QUOTE_TTL_SECONDS } from "@satdust/shared";
import { fetchBtcUsdMedian } from "@/lib/prices";
import { getQuoteSecret } from "@/lib/server/secrets";
import { assertMintIntegrity } from "@/lib/server/integrity";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { saveQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await rateLimit(req, "quote", 30, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();
    let quantity = 1;
    try {
      const body = (await req.json()) as { quantity?: number };
      if (body?.quantity != null) {
        const q = Math.floor(Number(body.quantity));
        if (!Number.isFinite(q) || q < 1 || q > 100_000) {
          return noStoreJson({ error: "Quantity must be at least 1" }, { status: 400 });
        }
        quantity = q;
      }
    } catch {
      /* empty body → qty 1 */
    }

    const { btcUsd, providerPrices } = await fetchBtcUsdMedian();
    const quote = createSignedQuote({
      btcUsd,
      providerPrices,
      secret: getQuoteSecret(),
      usd: MINT_USD * quantity,
      ttlSeconds: QUOTE_TTL_SECONDS,
    });
    saveQuote(quote);

    return noStoreJson({
      quoteId: quote.quoteId,
      usd: quote.usd,
      btcUsd: quote.btcUsd,
      feeSats: quote.feeSats,
      expiresAt: quote.expiresAt,
      network: quote.network,
      signature: quote.signature,
      mintUsd: MINT_USD,
      quantity,
      unitFeeSats: String(Math.round(Number(quote.feeSats) / quantity)),
      providerCount: providerPrices.length,
    });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Quote unavailable") },
      { status: 503 }
    );
  }
}
