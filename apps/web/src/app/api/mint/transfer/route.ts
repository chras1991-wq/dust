import {
  createSignedQuote,
  isQuoteExpired,
  usdToFeeSats,
  verifyQuoteSignature,
} from "@satdust/quote";
import { MINT_USD, NETWORK, PROJECT_ADDRESS } from "@satdust/shared";
import { splitMintPaymentSats } from "@/lib/mint-pricing";
import { hydrateMintStore, persistMintRecord } from "@/lib/server/mint-persist";
import { fetchBtcUsdMedian } from "@/lib/prices";
import { getQuoteSecret } from "@/lib/server/secrets";
import { assertMintIntegrity } from "@/lib/server/integrity";
import { noStoreJson, rateLimit, readJsonBody } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { getQuote, saveQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

export async function POST(req: Request) {
  const limited = await rateLimit(req, "mint-transfer", 60, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();
    await hydrateMintStore(true);

    const parsed = await readJsonBody<{
      address?: string;
      quantity?: number;
      quoteId?: string;
    }>(req);
    if (!parsed.ok) return parsed.response;

    const address = parsed.body.address?.trim() ?? "";
    const qty = Math.floor(Number(parsed.body.quantity ?? 1));
    if (!isValidBech32(address)) {
      return noStoreJson({ error: "Invalid Bitcoin mainnet address" }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 100_000) {
      return noStoreJson({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    let quoteFeeSatsTotal: number;
    let quoteId = parsed.body.quoteId?.trim() ?? "";

    const quote = quoteId ? getQuote(quoteId) : undefined;
    const quoteUnits =
      quote && verifyQuoteSignature(quote, getQuoteSecret()) ? Math.round(Number(quote.usd) / MINT_USD) : 0;
    if (
      quote &&
      verifyQuoteSignature(quote, getQuoteSecret()) &&
      quote.network === NETWORK &&
      !isQuoteExpired(quote) &&
      quoteUnits === qty
    ) {
      quoteFeeSatsTotal = Math.round(Number(quote.feeSats));
    } else {
      const { btcUsd, providerPrices } = await fetchBtcUsdMedian();
      const fresh = createSignedQuote({
        btcUsd,
        providerPrices,
        secret: getQuoteSecret(),
        usd: MINT_USD * qty,
      });
      saveQuote(fresh);
      quoteId = fresh.quoteId;
      quoteFeeSatsTotal = Math.round(usdToFeeSats(MINT_USD * qty, Number(fresh.btcUsd)));
    }

    if (!Number.isFinite(quoteFeeSatsTotal) || quoteFeeSatsTotal <= 0) {
      return noStoreJson({ error: "Price unavailable" }, { status: 503 });
    }

    const { paySats, carrierSats, projectFeeSats, unitProjectFeeSats } = splitMintPaymentSats(
      qty,
      quoteFeeSatsTotal
    );
    const mintId = `mint_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const now = Math.floor(Date.now() / 1000);

    await persistMintRecord({
      id: mintId,
      walletAddress: address,
      quoteId,
      amount: qty,
      carrierSats,
      projectFeeSats,
      status: "PSBT_CREATED",
      createdAt: now,
      updatedAt: now,
    });

    return noStoreJson({
      mintId,
      paySats,
      unitFeeSats: unitProjectFeeSats,
      quantity: qty,
      carrierSats,
      /** Wallet-only destination — never render in UI */
      payTo: PROJECT_ADDRESS,
      notice:
        "Send the exact amount from your wallet. Balance credits when the transfer is seen — no order lock, mint again anytime.",
    });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Mint transfer setup failed") },
      { status: 400 }
    );
  }
}
