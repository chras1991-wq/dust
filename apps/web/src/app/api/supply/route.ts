import { NextResponse } from "next/server";
import { getSupplySnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSupplySnapshot());
}
