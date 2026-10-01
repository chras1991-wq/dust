import { SWAP_POOL_ADDRESS } from "@satdust/shared";
import { recordSwap } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";

export const dynamic = "force-dynamic";

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

function isTxid(txid: string): boolean {
  return /^[0-9a-f]{64}$/i.test(txid);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "swap-complete", 20, 60_000);
  if (limited) return limited;

  try {
    const body = (await req.json()) as {
      walletAddress?: string;
      satdustAmount?: number;
      estimatedBtcSats?: number;
      fundingTxid?: string;
      fundingSats?: number;
      poolAddress?: string;
      direction?: string;
    };

    const walletAddress = body.walletAddress?.trim() ?? "";
    const fundingTxid = body.fundingTxid?.trim() ?? "";
    const poolAddress = body.poolAddress?.trim() ?? SWAP_POOL_ADDRESS;
    const satdustAmount = Math.floor(Number(body.satdustAmount));
    const estimatedBtcSats = Math.floor(Number(body.estimatedBtcSats));
    const fundingSats = Math.floor(Number(body.fundingSats));
    const direction = body.direction === "BTC_TO_SATDUST" ? "BTC_TO_SATDUST" : "SATDUST_TO_BTC";

    if (!isValidBech32(walletAddress)) {
      return noStoreJson({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!isTxid(fundingTxid)) {
      return noStoreJson({ error: "Invalid funding txid" }, { status: 400 });
    }
    if (poolAddress !== SWAP_POOL_ADDRESS) {
      return noStoreJson({ error: "Invalid pool address" }, { status: 400 });
    }
    if (!Number.isFinite(satdustAmount) || satdustAmount <= 0 || satdustAmount > 10_000) {
      return noStoreJson({ error: "SATDUST amount must be 1–10,000" }, { status: 400 });
    }
    if (!Number.isFinite(fundingSats) || fundingSats < 546) {
      return noStoreJson({ error: "Invalid funding amount" }, { status: 400 });
    }

    const id = `swap-${fundingTxid.slice(0, 16)}`;
    recordSwap({
      id,
      walletAddress,
      direction,
      satdustAmount,
      estimatedBtcSats: Number.isFinite(estimatedBtcSats) ? estimatedBtcSats : 0,
      fundingTxid,
      fundingSats,
      poolAddress,
      createdAt: Date.now(),
    });

    return noStoreJson({
      swapId: id,
      notice:
        "Pool received your BTC funding transaction. SATDUST → BTC payout is indexed after confirmation.",
    });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Swap record unavailable") },
      { status: 503 }
    );
  }
}
