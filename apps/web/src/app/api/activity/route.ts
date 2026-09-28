import { NextResponse } from "next/server";
import { listMints, getSupplySnapshot, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const mints = listMints()
    .filter((m) =>
      ["DUST_VALID", "REVEAL_CONFIRMED", "INDEXER_PENDING", "REVEAL_MEMPOOL"].includes(
        m.status
      )
    )
    .slice(0, 100)
    .map((m, i, arr) => ({
      mintSequence: m.mintSequence ?? arr.length - i,
      txid: m.revealTxid ?? null,
      inscriptionId: m.inscriptionId ?? null,
      owner: m.walletAddress,
      amount: m.amount,
      carrierSats: m.carrierSats,
      block: m.blockHeight ?? null,
      status: m.status,
    }));

  // Demo activity when no live mints yet
  const activity =
    mints.length > 0
      ? mints
      : [];

  return NextResponse.json({
    supply: getSupplySnapshot(),
    deployTxid: getStore().deployTxid,
    activity,
  });
}
