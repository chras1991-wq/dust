import { NextResponse } from "next/server";
import {
  DUST20_PROTOCOL,
  DUST20_VERSION,
  GENESIS_SUPPLY,
  MILESTONES,
  MINT_USD,
  NETWORK,
  PROJECT_ADDRESS,
  SUPPLY,
  TICK,
  UNIT_SATS,
  MAX_SATS,
  LIM_SATS,
  DEPLOY_PAYLOAD,
  VOTE_SATDUST_EQUIV_BTC,
} from "@satdust/shared";
import { getStore } from "@/lib/store";
import { getMilestoneSnapshot } from "@/lib/milestone-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const ms = getMilestoneSnapshot();
  return NextResponse.json({
    network: NETWORK,
    protocol: DUST20_PROTOCOL,
    protocolVersion: DUST20_VERSION,
    tick: TICK,
    supply: SUPPLY,
    genesisSupply: GENESIS_SUPPLY,
    unitSats: UNIT_SATS,
    maxSats: MAX_SATS,
    limSats: LIM_SATS,
    mintUsd: MINT_USD,
    projectAddress: PROJECT_ADDRESS,
    deployPayload: DEPLOY_PAYLOAD,
    deployTxid: store.deployTxid,
    deployInscriptionId: store.deployInscriptionId,
    mintOpen: ms.openCapacity > 0,
    openMintCapacity: ms.openCapacity,
    voteSatdustEquivBtc: VOTE_SATDUST_EQUIV_BTC,
    milestones: MILESTONES.map((m) => ({
      id: m.id,
      code: m.code,
      title: m.title,
      amount: m.amount,
      supplyAfter: m.supplyAfter,
      quorum: m.quorum,
      approval: m.approval,
    })),
  });
}
