import { NextResponse } from "next/server";
import { verifyMintLocal } from "@/lib/verify";
import { UNIT_SATS } from "@satdust/shared";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    txid?: string;
    payload?: Record<string, unknown>;
    carrierOutputSats?: number;
    inscriptionOffset?: number;
    projectOutputAddress?: string;
    existsOnMainnet?: boolean;
    indexerAccepted?: boolean;
  };

  const txid = body.txid?.trim() ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
    return NextResponse.json(
      { error: "txid must be 64 hex characters" },
      { status: 400 }
    );
  }

  // Attempt live fetch; fall back to local structural checks with provided fields.
  let existsOnMainnet = body.existsOnMainnet;
  let carrierOutputSats = body.carrierOutputSats;
  const payload = body.payload;

  if (existsOnMainnet === undefined) {
    try {
      const res = await fetch(`https://mempool.space/api/tx/${txid}`, {
        next: { revalidate: 0 },
      });
      if (res.ok) {
        existsOnMainnet = true;
        const tx = (await res.json()) as {
          vout: Array<{ value: number; scriptpubkey_address?: string }>;
        };
        if (carrierOutputSats === undefined && tx.vout[0]) {
          carrierOutputSats = tx.vout[0].value;
        }
      } else {
        existsOnMainnet = false;
      }
    } catch {
      existsOnMainnet = body.existsOnMainnet ?? true;
    }
  }

  const result = verifyMintLocal({
    txid,
    payload,
    carrierOutputSats: carrierOutputSats ?? UNIT_SATS,
    inscriptionOffset: body.inscriptionOffset ?? 0,
    projectOutputAddress: body.projectOutputAddress,
    existsOnMainnet,
    indexerAccepted: body.indexerAccepted,
  });

  return NextResponse.json(result);
}
