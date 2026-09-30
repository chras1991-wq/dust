import { getStore, listMints } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

function publicMintView(mint: ReturnType<typeof listMints>[number]) {
  return {
    id: mint.id,
    status: mint.status,
    amount: mint.amount,
    carrierSats: mint.carrierSats,
    createdAt: mint.createdAt,
    updatedAt: mint.updatedAt,
    revealTxid: mint.revealTxid ?? null,
    commitTxid: mint.commitTxid ?? null,
    // Do not expose full wallet address or quote internals.
    owner: mint.walletAddress
      ? `${mint.walletAddress.slice(0, 6)}…${mint.walletAddress.slice(-4)}`
      : null,
  };
}

export async function GET(req: Request) {
  const limited = await rateLimit(req, "mint-status", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const mintId = searchParams.get("mintId");
  const txid = searchParams.get("txid");

  if (mintId) {
    if (mintId.length > 128) {
      return noStoreJson({ error: "Invalid mintId" }, { status: 400 });
    }
    const mint = listMints().find((m) => m.id === mintId);
    if (!mint) return noStoreJson({ error: "Not found" }, { status: 404 });
    return noStoreJson(publicMintView(mint));
  }

  if (txid) {
    if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
      return noStoreJson({ error: "Invalid txid" }, { status: 400 });
    }
    const mint = listMints().find(
      (m) => m.revealTxid === txid || m.commitTxid === txid
    );
    if (!mint) return noStoreJson({ error: "Not found" }, { status: 404 });
    return noStoreJson(publicMintView(mint));
  }

  // No bulk mint dump — prevents wallet-address leakage.
  return noStoreJson({
    deployTxid: getStore().deployTxid,
    hint: "Pass mintId or txid",
  });
}
