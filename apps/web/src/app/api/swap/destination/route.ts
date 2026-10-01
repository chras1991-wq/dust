import { getSwapPoolAddress } from "@/lib/server/swap-pool";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await rateLimit(req, "swap-destination", 30, 60_000);
  if (limited) return limited;

  try {
    return noStoreJson({ address: getSwapPoolAddress() });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Unavailable") },
      { status: 503 }
    );
  }
}
