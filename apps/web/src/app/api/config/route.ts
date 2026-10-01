import {
  DUST20_PROTOCOL,
  DUST20_VERSION,
  GENESIS_SUPPLY,
  MILESTONES,
  MINT_USD,
  NETWORK,
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
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { assertMintIntegrity } from "@/lib/server/integrity";
import { publicErrorMessage } from "@/lib/server/safe-error";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await rateLimit(req, "config", 60, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();
    const store = getStore();
    const ms = getMilestoneSnapshot();
    return noStoreJson({
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
      deployPayload: DEPLOY_PAYLOAD,
      deployTxid: store.deployTxid,
      deployInscriptionId: store.deployInscriptionId,
      mintOpen: ms.openCapacity > 0,
      openMintCapacity: ms.openCapacity,
      voteSatdustEquivBtc: VOTE_SATDUST_EQUIV_BTC,
      swapOpen: true,
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
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Config unavailable") },
      { status: 503 }
    );
  }
}
