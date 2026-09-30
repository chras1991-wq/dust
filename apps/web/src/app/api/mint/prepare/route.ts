import { isQuoteExpired, verifyQuoteSignature } from "@satdust/quote";
import { PROJECT_ADDRESS, UNIT_SATS, NETWORK, MINT_USD } from "@satdust/shared";
import { hydrateMintStore, persistMintRecord, tryConsumeQuoteUnits } from "@/lib/server/mint-persist";
import { buildRevealPlan, assertPreBroadcast } from "@satdust/bitcoin";
import { getQuoteSecret } from "@/lib/server/secrets";
import { assertMintIntegrity } from "@/lib/server/integrity";
import { noStoreJson, rateLimit, readJsonBody } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { getQuote, getSupplySnapshot } from "@/lib/store";
import { getMilestoneSnapshot } from "@/lib/milestone-store";
import { estimateMinerFeeSats } from "@/lib/prices";

export const dynamic = "force-dynamic";

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

export async function POST(req: Request) {
  const limited = await rateLimit(req, "mint-prepare", 20, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();
    await hydrateMintStore();

    const parsed = await readJsonBody<{
      address?: string;
      publicKey?: string;
      quoteId?: string;
      amount?: number;
    }>(req);
    if (!parsed.ok) return parsed.response;

    const address = parsed.body.address?.trim() ?? "";
    const quoteId = parsed.body.quoteId?.trim() ?? "";

    if (!isValidBech32(address)) {
      return noStoreJson({ error: "Invalid Bitcoin mainnet address" }, { status: 400 });
    }
    if (!quoteId || quoteId.length > 128) {
      return noStoreJson({ error: "Invalid quoteId" }, { status: 400 });
    }

    const quote = getQuote(quoteId);
    if (!quote) {
      return noStoreJson({ error: "Unknown quoteId" }, { status: 400 });
    }
    if (isQuoteExpired(quote)) {
      return noStoreJson({ error: "Quote expired — refresh price" }, { status: 400 });
    }

    // Redundant signature check — never trust client-held quote fields alone.
    if (!verifyQuoteSignature(quote, getQuoteSecret())) {
      return noStoreJson({ error: "ABORT: tampered quote signature" }, { status: 400 });
    }
    if (quote.network !== NETWORK) {
      return noStoreJson({ error: "Wrong network" }, { status: 400 });
    }
    const amount = Math.floor(Number(parsed.body.amount ?? 1));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100_000) {
      return noStoreJson({ error: "Invalid mint amount" }, { status: 400 });
    }
    const quoteUnits = Math.round(Number(quote.usd) / MINT_USD);
    if (quoteUnits < 1) {
      return noStoreJson({ error: "ABORT: invalid quote units" }, { status: 400 });
    }
    const reserved = await tryConsumeQuoteUnits(quoteId, amount, quoteUnits);
    if (!reserved) {
      return noStoreJson(
        { error: "Quote does not cover this mint batch — refresh price" },
        { status: 400 }
      );
    }

    const supply = getSupplySnapshot();
    const milestones = getMilestoneSnapshot();
    if (milestones.openCapacity <= 0) {
      return noStoreJson(
        { error: "No open mint slots — wait for a passed milestone vote" },
        { status: 409 }
      );
    }
    if (supply.availableEstimated <= 0 || supply.remaining <= 0) {
      return noStoreJson({ error: "No estimated supply remaining" }, { status: 409 });
    }
    // Redundant capacity cross-check.
    if (milestones.openCapacity > supply.remaining) {
      return noStoreJson({ error: "ABORT: capacity invariant failed" }, { status: 409 });
    }

    const feeSats = Number(quote.feeSats);
    if (!Number.isFinite(feeSats) || feeSats <= 0) {
      return noStoreJson({ error: "ABORT: invalid fee" }, { status: 400 });
    }

    const minerFeeSats = await estimateMinerFeeSats();
    const changeSats = 0;

    const plan = buildRevealPlan({
      userAddress: address,
      projectFeeSats: feeSats,
      changeSats,
      minerFeeSats,
      projectAddress: PROJECT_ADDRESS,
    });
    assertPreBroadcast({
      carrierOutputValue: UNIT_SATS,
      inscriptionOffset: 0,
      projectOutputAddress: PROJECT_ADDRESS,
    });

    const mintId = `mint_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const now = Math.floor(Date.now() / 1000);

    await persistMintRecord({
      id: mintId,
      walletAddress: address,
      quoteId: quote.quoteId,
      amount,
      carrierSats: UNIT_SATS,
      projectFeeSats: feeSats,
      minerFeeSats,
      status: "PSBT_CREATED",
      createdAt: now,
      updatedAt: now,
    });

    return noStoreJson({
      mintId,
      status: "PSBT_CREATED",
      quote: {
        quoteId: quote.quoteId,
        feeSats: quote.feeSats,
        usd: quote.usd,
        expiresAt: quote.expiresAt,
      },
      carrierSats: plan.outputs[0]?.value ?? UNIT_SATS,
      feeSats,
      notice:
        "Mint availability is not guaranteed until your transaction is confirmed and accepted by the DUST-20 indexer.",
      next: [
        "Construct commit inscription PSBT client-side or via indexer-backed builder",
        "Sign commit with wallet",
        "Broadcast commit",
        "Build reveal with UTXO=546 sats @ offset 0 and project fee output",
        "Sign and broadcast reveal",
      ],
    });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Mint prepare failed") },
      { status: 400 }
    );
  }
}
