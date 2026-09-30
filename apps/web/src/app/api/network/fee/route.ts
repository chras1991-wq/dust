import { NextResponse } from "next/server";
import { estimateMinerFeeSats } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  const minerFeeSats = await estimateMinerFeeSats();
  return NextResponse.json({
    network: "mainnet",
    estimatedMinerFeeSats: minerFeeSats,
    note: "Estimate for commit+reveal inscription path; wallet may differ.",
  });
}
