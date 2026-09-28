import { NextResponse } from "next/server";
import { isQuoteExpired, verifyQuoteSignature } from "@satdust/quote";
import { PROJECT_ADDRESS, UNIT_SATS, NETWORK } from "@satdust/shared";
import { buildRevealPlan, assertPreBroadcast } from "@satdust/bitcoin";
import { getQuoteSecret } from "@/lib/site";
import { getQuote, getSupplySnapshot, upsertMint } from "@/lib/store";
import { estimateMinerFeeSats } from "@/lib/prices";

export const dynamic = "force-dynamic";

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    address?: string;
    publicKey?: string;
    quoteId?: string;
  };

  const address = body.address?.trim() ?? "";
  const quoteId = body.quoteId?.trim() ?? "";

  if (!isValidBech32(address)) {
    return NextResponse.json({ error: "Invalid Bitcoin mainnet address" }, { status: 400 });
  }

  const quote = getQuote(quoteId);
  if (!quote) {
    return NextResponse.json({ error: "Unknown quoteId" }, { status: 400 });
  }
  if (isQuoteExpired(quote)) {
    return NextResponse.json({ error: "Quote expired — refresh price" }, { status: 400 });
  }
  if (!verifyQuoteSignature(quote, getQuoteSecret())) {
    return NextResponse.json({ error: "ABORT: tampered quote signature" }, { status: 400 });
  }
  if (quote.network !== NETWORK) {
    return NextResponse.json({ error: "Wrong network" }, { status: 400 });
  }

  const supply = getSupplySnapshot();
  if (supply.availableEstimated <= 0) {
    return NextResponse.json({ error: "No estimated supply remaining" }, { status: 409 });
  }

  const feeSats = Number(quote.feeSats);
  const minerFeeSats = await estimateMinerFeeSats();
  const changeSats = 0;

  let plan;
  try {
    plan = buildRevealPlan({
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
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ABORT" },
      { status: 400 }
    );
  }

  const mintId = `mint_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const now = Math.floor(Date.now() / 1000);

  upsertMint({
    id: mintId,
    walletAddress: address,
    quoteId: quote.quoteId,
    amount: 1,
    carrierSats: UNIT_SATS,
    projectFeeSats: feeSats,
    minerFeeSats,
    status: "PSBT_CREATED",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    mintId,
    status: "PSBT_CREATED",
    projectAddress: PROJECT_ADDRESS,
    quote: {
      quoteId: quote.quoteId,
      feeSats: quote.feeSats,
      usd: quote.usd,
      expiresAt: quote.expiresAt,
    },
    revealPlan: plan,
    notice:
      "Mint availability is not guaranteed until your transaction is confirmed and accepted by the DUST-20 indexer.",
    next: [
      "Construct commit inscription PSBT client-side or via indexer-backed builder",
      "Sign commit with wallet",
      "Broadcast commit",
      "Build reveal with carrier=546 sats @ offset 0 and project fee output",
      "Sign and broadcast reveal",
    ],
  });
}
