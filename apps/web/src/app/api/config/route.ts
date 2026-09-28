import { NextResponse } from "next/server";
import {
  DUST20_PROTOCOL,
  DUST20_VERSION,
  MINT_USD,
  NETWORK,
  PROJECT_ADDRESS,
  SUPPLY,
  TICK,
  UNIT_SATS,
  MAX_SATS,
  LIM_SATS,
  DEPLOY_PAYLOAD,
} from "@satdust/shared";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    network: NETWORK,
    protocol: DUST20_PROTOCOL,
    protocolVersion: DUST20_VERSION,
    tick: TICK,
    supply: SUPPLY,
    unitSats: UNIT_SATS,
    maxSats: MAX_SATS,
    limSats: LIM_SATS,
    mintUsd: MINT_USD,
    projectAddress: PROJECT_ADDRESS,
    deployPayload: DEPLOY_PAYLOAD,
    deployTxid: store.deployTxid,
    deployInscriptionId: store.deployInscriptionId,
    mintOpen: Boolean(store.deployTxid),
  });
}
