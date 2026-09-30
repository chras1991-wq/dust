import { UNIT_SATS } from "@satdust/shared";
import { PROJECT_ADDRESS } from "@satdust/shared/project";

export {
  buildOrdMintScript,
  createMintInscribePlan,
  buildAndSignRevealTx,
  broadcastTx,
  findCommitUtxo,
  type MintInscribePlan,
} from "./inscribe-mint";

export type TxOutput = {
  address: string;
  value: number;
  role: "carrier" | "project_fee" | "change" | "other";
};

export type RevealPlan = {
  outputs: TxOutput[];
  carrierIndex: number;
  projectFeeIndex: number;
  minerFeeSats: number;
};

/**
 * Conceptual reveal layout:
 * OUTPUT 0 — user carrier (exactly unit_sats)
 * OUTPUT 1 — project fee (quote.feeSats)
 * OUTPUT 2 — user change (optional)
 * Miner fee from other inputs — never from carrier.
 */
export function buildRevealPlan(args: {
  userAddress: string;
  projectFeeSats: number;
  changeSats: number;
  minerFeeSats: number;
  projectAddress?: string;
}): RevealPlan {
  const projectAddress = args.projectAddress ?? PROJECT_ADDRESS;
  if (projectAddress !== PROJECT_ADDRESS) {
    throw new Error("ABORT: project address mismatch");
  }
  if (args.projectFeeSats <= 0) {
    throw new Error("ABORT: project fee must be positive");
  }

  const outputs: TxOutput[] = [
    {
      address: args.userAddress,
      value: UNIT_SATS,
      role: "carrier",
    },
    {
      address: projectAddress,
      value: args.projectFeeSats,
      role: "project_fee",
    },
  ];

  if (args.changeSats > 0) {
    outputs.push({
      address: args.userAddress,
      value: args.changeSats,
      role: "change",
    });
  }

  return {
    outputs,
    carrierIndex: 0,
    projectFeeIndex: 1,
    minerFeeSats: args.minerFeeSats,
  };
}

export function assertPreBroadcast(args: {
  carrierOutputValue: number;
  inscriptionOffset: number;
  projectOutputAddress: string;
}): void {
  if (args.carrierOutputValue !== UNIT_SATS) {
    throw new Error(
      `ABORT: carrier output must be ${UNIT_SATS} sats, got ${args.carrierOutputValue}`
    );
  }
  if (args.inscriptionOffset !== 0) {
    throw new Error(
      `ABORT: inscription offset must be 0, got ${args.inscriptionOffset}`
    );
  }
  if (args.projectOutputAddress !== PROJECT_ADDRESS) {
    throw new Error("ABORT: project payment address mismatch");
  }
}

export const MINT_STATUSES = [
  "QUOTE_CREATED",
  "PSBT_CREATED",
  "COMMIT_SIGNED",
  "COMMIT_BROADCAST",
  "COMMIT_CONFIRMED",
  "REVEAL_CREATED",
  "REVEAL_SIGNED",
  "REVEAL_BROADCAST",
  "REVEAL_MEMPOOL",
  "REVEAL_CONFIRMED",
  "INDEXER_PENDING",
  "DUST_VALID",
  "DUST_INVALID",
  "EXPIRED",
  "USER_REJECTED",
  "BROADCAST_FAILED",
  "RBF_REPLACED",
  "REORGED",
] as const;

export type MintStatus = (typeof MINT_STATUSES)[number];
