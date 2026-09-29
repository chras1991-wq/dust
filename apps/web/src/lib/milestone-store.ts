/**
 * Demo milestone runtime state for the mint roadmap UI.
 * Chain + indexer remain source of truth for confirmed balances.
 */

import {
  GENESIS_SUPPLY,
  MILESTONES,
  type MilestoneId,
  type MilestoneStatus,
  dilutionPct,
} from "@satdust/shared";

export type GoalProgress = {
  id: string;
  current: number;
  met: boolean;
  /** For any_of: which option indices are met */
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

declare global {
  var __satdustMilestones: MilestoneSnapshot | undefined;
}

/**
 * Demo: Genesis + Foundation + First 50 minted (2,650).
 * Stable Community (M3) in progress — matches design reference.
 */
function buildDemoSnapshot(): MilestoneSnapshot {
  const stages: MilestoneRuntime[] = [
    {
      id: "genesis",
      status: "MINTED",
      mintedAt: "2026-09-01",
      goals: [{ id: "deploy", current: 1, met: true }],
    },
    {
      id: "m1",
      status: "MINTED",
      mintedAt: "2026-09-16",
      voteYes: 38,
      voteNo: 9,
      eligibleVoters: 42,
      goals: [
        { id: "age", current: 1, met: true },
        { id: "site", current: 1, met: true },
        { id: "rules", current: 1, met: true },
        { id: "treasury", current: 1, met: true },
      ],
    },
    {
      id: "m2",
      status: "MINTED",
      mintedAt: "2026-10-08",
      voteYes: 31,
      voteNo: 12,
      eligibleVoters: 47,
      goals: [
        { id: "holders", current: 52, met: true },
        { id: "holders14", current: 33, met: true },
      ],
    },
    {
      id: "m3",
      status: "IN_PROGRESS",
      goals: [
        { id: "holders", current: 82, met: false },
        { id: "holders30", current: 41, met: false },
        { id: "top10", current: 51, met: true },
      ],
    },
    {
      id: "m4",
      status: "LOCKED",
      goals: [
        { id: "utility", current: 0, met: false },
        { id: "users", current: 0, met: false },
        { id: "holders", current: 82, met: false },
      ],
    },
    {
      id: "m5",
      status: "LOCKED",
      goals: [
        { id: "holders", current: 82, met: false },
        { id: "users", current: 0, met: false },
        { id: "returning", current: 0, met: false },
      ],
    },
    {
      id: "m6",
      status: "LOCKED",
      goals: [
        {
          id: "external",
          current: 0,
          met: false,
          optionMet: [false, false, false, false, false],
        },
      ],
    },
    {
      id: "m7",
      status: "LOCKED",
      goals: [
        { id: "holders", current: 82, met: false },
        { id: "holders30", current: 41, met: false },
        { id: "users", current: 0, met: false },
        {
          id: "growth",
          current: 0,
          met: false,
          optionMet: [false, false, false, false, false],
        },
      ],
    },
  ];

  const minted = GENESIS_SUPPLY + 250 + 400; // 2_650
  const authorized = minted;

  return {
    minted,
    authorized,
    openCapacity: Math.max(0, authorized - minted),
    currentId: "m3",
    stages,
    tagline:
      "SATDUST cannot be minted by time. It must be earned by progress and approved by holders.",
    formula: "Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)",
  };
}

export function getMilestoneSnapshot(): MilestoneSnapshot {
  if (!globalThis.__satdustMilestones) {
    globalThis.__satdustMilestones = buildDemoSnapshot();
  }
  return globalThis.__satdustMilestones;
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
          ? dilutionPct(def.amount, snap.minted)
          : null,
      supplyIfApproved: def.supplyAfter,
    };
  });

  const current = stages.find((s) => s.id === snap.currentId) ?? stages[0];

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
