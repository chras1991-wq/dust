/**
 * Milestone runtime — minted count follows the real supply store (no fake fills).
 * At launch: Genesis capacity 5,460 authorized, 0 minted.
 */

import {
  GENESIS_SUPPLY,
  MILESTONES,
  type MilestoneId,
  type MilestoneStatus,
  dilutionPct,
} from "@satdust/shared";
import { getStore, getSupplySnapshot } from "@/lib/store";

export type GoalProgress = {
  id: string;
  current: number;
  met: boolean;
  optionMet?: boolean[];
};

export type MilestoneRuntime = {
  id: MilestoneId;
  status: MilestoneStatus;
  goals: GoalProgress[];
  mintedAt?: string;
  voteYes?: number;
  voteNo?: number;
  eligibleVoters?: number;
  snapshotBlock?: number | null;
  proposalOpen?: boolean;
};

export type MilestoneSnapshot = {
  minted: number;
  authorized: number;
  openCapacity: number;
  currentId: MilestoneId;
  stages: MilestoneRuntime[];
  tagline: string;
  formula: string;
};

function emptyGoals(
  ids: string[],
  opts?: { anyOfId?: string; optionCount?: number }
): GoalProgress[] {
  return ids.map((id) => {
    if (opts?.anyOfId === id) {
      return {
        id,
        current: 0,
        met: false,
        optionMet: Array.from({ length: opts.optionCount ?? 0 }, () => false),
      };
    }
    return { id, current: 0, met: false };
  });
}

function buildLiveSnapshot(): MilestoneSnapshot {
  const supply = getSupplySnapshot();
  const store = getStore();
  const minted = supply.minted;
  const deployLive = Boolean(store.deployTxid);

  const authorized = GENESIS_SUPPLY;
  const openCapacity = Math.max(0, authorized - minted);

  const genesisStatus: MilestoneStatus =
    minted >= GENESIS_SUPPLY ? "MINTED" : "IN_PROGRESS";

  const stages: MilestoneRuntime[] = [
    {
      id: "genesis",
      status: genesisStatus,
      goals: [{ id: "deploy", current: deployLive ? 1 : 0, met: deployLive }],
    },
    { id: "m1", status: "LOCKED", goals: emptyGoals(["age", "site", "rules", "treasury"]) },
    { id: "m2", status: "LOCKED", goals: emptyGoals(["holders", "holders14", "top10"]) },
    { id: "m3", status: "LOCKED", goals: emptyGoals(["eligible", "turnout", "holders"]) },
    { id: "m4", status: "LOCKED", goals: emptyGoals(["stake_live", "staked", "stakers"]) },
    { id: "m5", status: "LOCKED", goals: emptyGoals(["agent_live", "agents", "agent_wallets"]) },
    { id: "m6", status: "LOCKED", goals: emptyGoals(["pool_live", "btc_depth", "token_depth"]) },
    {
      id: "m7",
      status: "LOCKED",
      goals: emptyGoals(["holders", "holders30", "returning", "top10"]),
    },
    { id: "m8", status: "LOCKED", goals: emptyGoals(["staked", "stakers", "stake_ratio"]) },
    { id: "m9", status: "LOCKED", goals: emptyGoals(["agents", "agent_wallets", "agent_actions"]) },
    {
      id: "m10",
      status: "LOCKED",
      goals: emptyGoals(["btc_depth", "token_depth", "swaps", "vol30"]),
    },
    {
      id: "m11",
      status: "LOCKED",
      goals: emptyGoals(["compute_live", "compute_bonds", "auction"]),
    },
    { id: "m12", status: "LOCKED", goals: emptyGoals(["eligible", "turnout", "holders"]) },
    { id: "m13", status: "LOCKED", goals: emptyGoals(["mcap", "staked", "btc_depth"]) },
    {
      id: "m14",
      status: "LOCKED",
      goals: emptyGoals(["holders", "btc_depth", "agents", "vol30"]),
    },
    {
      id: "m15",
      status: "LOCKED",
      goals: emptyGoals(["mcap", "staked", "turnout", "top10"]),
    },
    {
      id: "m16",
      status: "LOCKED",
      goals: emptyGoals(["mcap", "staked", "btc_depth", "agents", "eligible"]),
    },
    {
      id: "m17",
      status: "LOCKED",
      goals: emptyGoals(["mcap", "btc_depth", "vol30", "holders", "staked"]),
    },
    {
      id: "m18",
      status: "LOCKED",
      goals: emptyGoals(["mcap", "agents", "staked", "turnout", "btc_depth"]),
    },
    {
      id: "m19",
      status: "LOCKED",
      goals: emptyGoals(
        ["mcap", "holders", "holders30", "staked", "btc_depth", "agents", "maturity"],
        { anyOfId: "maturity", optionCount: 4 }
      ),
    },
  ];

  return {
    minted,
    authorized,
    openCapacity,
    currentId: genesisStatus === "MINTED" ? "m1" : "genesis",
    stages,
    tagline:
      "No timed unlocks. Hard gates — stake, agents, AMM depth, vote turnout, secondary market cap — then holders vote. Contributors whitelist first after Genesis.",
    formula: "Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)",
  };
}

export function getMilestoneSnapshot(): MilestoneSnapshot {
  return buildLiveSnapshot();
}

export function getMilestoneView() {
  const snap = getMilestoneSnapshot();
  const stages = snap.stages.map((runtime) => {
    const def = MILESTONES.find((m) => m.id === runtime.id)!;
    const goalsComplete = runtime.goals.every((g) => g.met);
    const goalsMetCount = runtime.goals.filter((g) => g.met).length;
    return {
      ...def,
      status: runtime.status,
      goals: def.goals.map((g) => {
        const prog = runtime.goals.find((x) => x.id === g.id);
        return {
          ...g,
          current: prog?.current ?? 0,
          met: prog?.met ?? false,
          optionMet: prog?.optionMet,
        };
      }),
      goalsComplete,
      goalsMetCount,
      goalsTotal: def.goals.length,
      mintedAt: runtime.mintedAt,
      voteYes: runtime.voteYes,
      voteNo: runtime.voteNo,
      eligibleVoters: runtime.eligibleVoters,
      dilution:
        runtime.status === "IN_PROGRESS" || runtime.status === "REACHED"
          ? dilutionPct(def.amount, Math.max(snap.minted, 1))
          : null,
      supplyIfApproved: def.supplyAfter,
    };
  });

  const current =
    stages.find((s) => s.id === snap.currentId) ??
    stages.find((s) => s.status === "IN_PROGRESS") ??
    stages[0];

  return {
    ...snap,
    stages,
    current,
    supplyTicks: MILESTONES.map((m) => ({
      id: m.id,
      code: m.code,
      title: m.title,
      supplyAfter: m.supplyAfter,
      amount: m.amount,
      status: stages.find((s) => s.id === m.id)?.status ?? "LOCKED",
    })),
  };
}
