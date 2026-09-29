import { estimateMinerFeeSats } from "@/lib/prices";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "fee", 60, 60_000);
  if (limited) return limited;

  const minerFeeSats = await estimateMinerFeeSats();
  return noStoreJson({
    network: "mainnet",
    estimatedMinerFeeSats: minerFeeSats,
    note: "Estimate for commit+reveal inscription path; wallet may differ.",
  });
}
