import { UNIT_SATS } from "@satdust/shared";
import { verifyMintLocal } from "@/lib/verify";
import { noStoreJson, rateLimit, readJsonBody } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";
import { assertMintIntegrity } from "@/lib/server/integrity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await rateLimit(req, "verify", 40, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();

    const parsed = await readJsonBody<{
      txid?: string;
      payload?: Record<string, unknown>;
      carrierOutputSats?: number;
      inscriptionOffset?: number;
      projectOutputAddress?: string;
      existsOnMainnet?: boolean;
      indexerAccepted?: boolean;
    }>(req);
    if (!parsed.ok) return parsed.response;

    const txid = parsed.body.txid?.trim() ?? "";
    if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
      return noStoreJson({ error: "txid must be 64 hex characters" }, { status: 400 });
    }

    let existsOnMainnet = parsed.body.existsOnMainnet;
    let carrierOutputSats = parsed.body.carrierOutputSats;
    const payload = parsed.body.payload;

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
        existsOnMainnet = parsed.body.existsOnMainnet ?? true;
      }
    }

    const result = verifyMintLocal({
      txid,
      payload,
      carrierOutputSats: carrierOutputSats ?? UNIT_SATS,
      inscriptionOffset: parsed.body.inscriptionOffset ?? 0,
      projectOutputAddress: parsed.body.projectOutputAddress,
      existsOnMainnet,
      indexerAccepted: parsed.body.indexerAccepted,
    });

    return noStoreJson(result);
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Verify failed") },
      { status: 400 }
    );
  }
}
