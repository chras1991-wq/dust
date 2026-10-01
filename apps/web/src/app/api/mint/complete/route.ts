import { noStoreJson, rateLimit, readJsonBody } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { getStore, listMints, upsertMint } from "@/lib/store";
import { schedulePersistStore } from "@/lib/store-persist";
import { isMintClosed } from "@/lib/mint-phase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req, "mint-complete", 30, 60_000);
  if (limited) return limited;

  try {
    if (isMintClosed()) {
      return noStoreJson({ error: "Mint closed" }, { status: 403 });
    }
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

    upsertMint({
      ...mint,
      amount,
      status: "REVEAL_BROADCAST",
      commitTxid: parsed.body.commitTxid ?? mint.commitTxid,
      revealTxid: parsed.body.revealTxid ?? mint.revealTxid,
      updatedAt: now,
    });

    if (wasPending) {
      const store = getStore();
      store.pendingMinted += amount;
      schedulePersistStore(store);
    }

    return noStoreJson({ ok: true, mintId, status: "REVEAL_BROADCAST" });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Mint complete failed") },
      { status: 400 }
    );
  }
}
