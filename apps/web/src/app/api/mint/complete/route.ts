import { noStoreJson, rateLimit, readJsonBody } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { listMints } from "@/lib/store";
import {
  claimMintCredit,
  markMintCredit,
  releaseMintCredit,
} from "@/lib/server/chain-reconcile";
import {
  hydrateMintStore,
  persistMintRecord,
  recordMintBroadcast,
} from "@/lib/server/mint-persist";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await rateLimit(req, "mint-complete", 30, 60_000);
  if (limited) return limited;

  try {
    await hydrateMintStore(true);
    const parsed = await readJsonBody<{
      mintId?: string;
      commitTxid?: string;
      revealTxid?: string;
      amount?: number;
    }>(req);
    if (!parsed.ok) return parsed.response;

    const mintId = parsed.body.mintId?.trim() ?? "";
    if (!mintId || mintId.length > 128) {
      return noStoreJson({ error: "Invalid mintId" }, { status: 400 });
    }

    const mint = listMints().find((m) => m.id === mintId);
    if (!mint) {
      return noStoreJson({ error: "Unknown mintId" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const amount = parsed.body.amount ?? mint.amount;
    const wasPending =
      mint.status === "PSBT_CREATED" || mint.status === "QUOTE_CREATED";
    const txid = (parsed.body.revealTxid ?? parsed.body.commitTxid ?? "").trim();

    const updated = {
      ...mint,
      amount,
      status: "REVEAL_BROADCAST" as const,
      commitTxid: parsed.body.commitTxid ?? mint.commitTxid,
      revealTxid: parsed.body.revealTxid ?? mint.revealTxid,
      updatedAt: now,
    };

    if (wasPending) {
      const claimed = await claimMintCredit(txid);
      if (!claimed) {
        return noStoreJson({ ok: true, mintId, status: mint.status, duplicate: true });
      }
      try {
        await recordMintBroadcast(updated, amount);
        await markMintCredit(txid);
      } catch (err) {
        await releaseMintCredit(txid);
        throw err;
      }
    } else {
      await persistMintRecord(updated);
    }

    return noStoreJson({ ok: true, mintId, status: "REVEAL_BROADCAST" });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Mint complete failed") },
      { status: 400 }
    );
  }
}
