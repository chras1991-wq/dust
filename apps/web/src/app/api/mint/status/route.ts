import { NextResponse } from "next/server";
import { getStore, listMints } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mintId = searchParams.get("mintId");
  const txid = searchParams.get("txid");

  if (mintId) {
    const mint = listMints().find((m) => m.id === mintId);
    if (!mint) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mint);
  }

  if (txid) {
    const mint = listMints().find(
      (m) => m.revealTxid === txid || m.commitTxid === txid
    );
    if (!mint) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mint);
  }

  return NextResponse.json({
    deployTxid: getStore().deployTxid,
    mints: listMints().slice(0, 50),
  });
}
