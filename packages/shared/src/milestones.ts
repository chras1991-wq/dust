/**
 * SATDUST milestone issuance — supply is earned by progress, then approved by vote.
 *
 * S_max = 10_000
 * S_0   = 2_000  (Genesis)
 * S_i   unlocked only when Milestone_i ∧ Quorum ∧ Approval
 *
 * Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)
 */

/** Keep in sync with SUPPLY in index.ts */
const SUPPLY_CAP = 10_000;

export const GENESIS_SUPPLY = 2_000;
export const RESERVE_SUPPLY = SUPPLY_CAP - GENESIS_SUPPLY; // 8_000

/** BTC balance at snapshot ≥ this → eligible voter. Power: 1 wallet = 1 vote. */
export const VOTE_BTC_THRESHOLD = 0.01;

export const VOTE_PERIOD_DAYS = 3;
export const REVOTE_COOLDOWN_DAYS = 14;
export const MINT_COOLDOWN_DAYS_EARLY = 21; // after M1–M5
export const MINT_COOLDOWN_DAYS_LATE = 30; // after M6–M7

export type MilestoneId =
  | "genesis"
  | "m1"
  | "m2"
  | "m3"
  | "m4"
  | "m5"
  | "m6"
  | "m7";

export type MilestoneStatus =
  | "LOCKED"
  | "IN_PROGRESS"
  | "REACHED"
  | "VOTING"
  | "MINTED"
  | "REJECTED";

export type GoalKind = "boolean" | "ratio" | "inverse_ratio" | "any_of";

export type MilestoneGoalDef = {
  id: string;
  label: string;
  kind: GoalKind;
  /** Target for ratio goals (current/target) or inverse (current ≤ target). */
  target?: number;
  /** Human formula, e.g. H ≥ 50 */
  formula: string;
  /** For any_of: option labels */
  options?: string[];
  /** How many options must pass for any_of */
  need?: number;
};

export type MilestoneDef = {
  id: MilestoneId;
  index: number;
  code: string;
  title: string;
  blurb: string;
  amount: number;
  /** Cumulative supply after this stage is minted */
  supplyAfter: number;
  /** true = Genesis (no vote); false = needs milestone + vote */
  isGenesis: boolean;
  goals: MilestoneGoalDef[];
  quorum: number;
  approval: number;
  cooldownDays: number;
};

/**
 * 2000 → +250 → 2250 → +400 → 2650 → +650 → 3300
 * → +900 → 4200 → +1200 → 5400 → +1800 → 7200 → +2800 → 10000
 */
export const MILESTONES: MilestoneDef[] = [
  {
    id: "genesis",
    index: 0,
    code: "01",
    title: "Genesis",
    blurb: "Initial open mint capacity at launch.",
    amount: 2_000,
    supplyAfter: 2_000,
    isGenesis: true,
    goals: [
      {
        id: "deploy",
        label: "DUST-20 deploy confirmed on mainnet",
        kind: "boolean",
        formula: "Deploy ∈ L1",
      },
    ],
    quorum: 0,
    approval: 0,
    cooldownDays: 0,
  },
  {
    id: "m1",
    index: 1,
    code: "02",
    title: "Foundation",
    blurb: "Project infrastructure is live and issuance rules are public.",
    amount: 250,
    supplyAfter: 2_250,
    isGenesis: false,
    goals: [
      {
        id: "age",
        label: "Project live ≥ 14 days",
        kind: "boolean",
        formula: "Age ≥ 14D",
      },
      {
        id: "site",
        label: "Public page: supply, roadmap, treasury, mint history, governance",
        kind: "boolean",
        formula: "Site = Live",
      },
      {
        id: "rules",
        label: "Issuance rules published and fixed for all 7 milestones",
        kind: "boolean",
        formula: "Rules = Public",
      },
      {
        id: "treasury",
        label: "Treasury address published",
        kind: "boolean",
        formula: "Treasury ≠ ∅",
      },
    ],
    quorum: 0.2,
    approval: 0.6,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m2",
    index: 2,
    code: "03",
    title: "First 50",
    blurb: "A natural holder base forms — team wallets excluded.",
    amount: 400,
    supplyAfter: 2_650,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders (ex-team)",
        kind: "ratio",
        target: 50,
        formula: "H ≥ 50",
      },
      {
        id: "holders14",
        label: "Holders ≥ 14 days (ex-team)",
        kind: "ratio",
        target: 30,
        formula: "H₁₄d ≥ 30",
      },
    ],
    quorum: 0.2,
    approval: 0.6,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m3",
    index: 3,
    code: "04",
    title: "Stable Community",
    blurb: "Growth, retention, and distribution — not just headcount.",
    amount: 650,
    supplyAfter: 3_300,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 100,
        formula: "H ≥ 100",
      },
      {
        id: "holders30",
        label: "Holders ≥ 30 days",
        kind: "ratio",
        target: 50,
        formula: "H₃₀d ≥ 50",
      },
      {
        id: "top10",
        label: "Top 10 non-team concentration",
        kind: "inverse_ratio",
        target: 55,
        formula: "C_top10 ≤ 55%",
      },
    ],
    quorum: 0.2,
    approval: 0.6,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m4",
    index: 4,
    code: "05",
    title: "First Utility",
    blurb: "A real SATDUST utility is live and used — not just a landing page.",
    amount: 900,
    supplyAfter: 4_200,
    isGenesis: false,
    goals: [
      {
        id: "utility",
        label: "SATDUST utility deployed and reachable",
        kind: "boolean",
        formula: "Utility = Live",
      },
      {
        id: "users",
        label: "Unique wallets that used the utility",
        kind: "ratio",
        target: 30,
        formula: "U_unique ≥ 30",
      },
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 100,
        formula: "H ≥ 100",
      },
    ],
    quorum: 0.25,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m5",
    index: 5,
    code: "06",
    title: "Product Validation",
    blurb: "People come back — usage on more than one day.",
    amount: 1_200,
    supplyAfter: 5_400,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 200,
        formula: "H ≥ 200",
      },
      {
        id: "users",
        label: "Product users",
        kind: "ratio",
        target: 75,
        formula: "U ≥ 75",
      },
      {
        id: "returning",
        label: "Returning users (2+ distinct days)",
        kind: "ratio",
        target: 30,
        formula: "U_returning ≥ 30",
      },
    ],
    quorum: 0.25,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m6",
    index: 6,
    code: "07",
    title: "External Validation",
    blurb: "Outside proof — integrations, revenue, or community execution. Any 2 of 5.",
    amount: 1_800,
    supplyAfter: 7_200,
    isGenesis: false,
    goals: [
      {
        id: "external",
        label: "Pass any 2 external signals",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(A…E)",
        options: [
          "A · Holders ≥ 350",
          "B · Product users ≥ 150",
          "C · Independent SATDUST integration",
          "D · Cumulative product revenue ≥ 0.1 BTC",
          "E · Community-authored proposal executed",
        ],
      },
    ],
    quorum: 0.3,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m7",
    index: 7,
    code: "08",
    title: "Maturity",
    blurb: "Final release. Hard base metrics plus any 2 growth conditions.",
    amount: 2_800,
    supplyAfter: 10_000,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 500,
        formula: "H ≥ 500",
      },
      {
        id: "holders30",
        label: "Holders ≥ 30 days",
        kind: "ratio",
        target: 200,
        formula: "H₃₀d ≥ 200",
      },
      {
        id: "users",
        label: "Product users",
        kind: "ratio",
        target: 200,
        formula: "U ≥ 200",
      },
      {
        id: "growth",
        label: "Pass any 2 growth conditions",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(Growth)",
        options: [
          "Revenue ≥ 0.5 BTC",
          "≥ 2 independent integrations",
          "≥ 3 community proposals executed",
          "≥ 100 returning product users",
          "Project age ≥ 180 days",
        ],
      },
    ],
    quorum: 0.3,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
];

export function getMilestone(id: MilestoneId): MilestoneDef {
  const m = MILESTONES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown milestone ${id}`);
  return m;
}

/** Dilution if amount is minted against currentSupply. */
export function dilutionPct(amount: number, currentSupply: number): number {
  if (currentSupply <= 0) return 100;
  return (amount / currentSupply) * 100;
}

export function assertMilestoneSum(): boolean {
  const sum = MILESTONES.reduce((a, m) => a + m.amount, 0);
  return sum === SUPPLY_CAP;
}
