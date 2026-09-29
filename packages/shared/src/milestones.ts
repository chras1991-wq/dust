/**
 * SATDUST milestone mint — more supply only after progress + a holder vote.
 *
 * S_max = 54_600
 * S_0   = 5_460  (Genesis)
 * S_i   opens only when Milestone_i ∧ Quorum ∧ Approval
 *
 * Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)
 *
 * Curve: later milestones unlock more units and require harder, measurable goals.
 */

/** Keep in sync with SUPPLY in index.ts */
const SUPPLY_CAP = 54_600;

export const GENESIS_SUPPLY = 5_460;
export const RESERVE_SUPPLY = SUPPLY_CAP - GENESIS_SUPPLY; // 49_140

/**
 * Vote eligibility: wallet SATDUST valued ≥ this BTC amount at the live rate
 * (proposal snapshot). Holding BTC alone does not qualify. 1 wallet = 1 vote.
 */
export const VOTE_SATDUST_EQUIV_BTC = 0.005;
/** @deprecated Use VOTE_SATDUST_EQUIV_BTC */
export const VOTE_BTC_THRESHOLD = VOTE_SATDUST_EQUIV_BTC;

export const VOTE_PERIOD_DAYS = 3;
export const REVOTE_COOLDOWN_DAYS = 14;
export const MINT_COOLDOWN_DAYS_EARLY = 21; // after M1–M6
export const MINT_COOLDOWN_DAYS_MID = 30; // after M7–M9
export const MINT_COOLDOWN_DAYS_LATE = 45; // after M10–M12

export type MilestoneId =
  | "genesis"
  | "m1"
  | "m2"
  | "m3"
  | "m4"
  | "m5"
  | "m6"
  | "m7"
  | "m8"
  | "m9"
  | "m10"
  | "m11"
  | "m12";

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
  /** Short check label, e.g. H ≥ 50 */
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
 * 5460
 * → +600 → 6060 → +1200 → 7260 → +1800 → 9060 → +2500 → 11560
 * → +3200 → 14760 → +3800 → 18560 → +4400 → 22960 → +5000 → 27960
 * → +5700 → 33660 → +6400 → 40060 → +7000 → 47060 → +7540 → 54600
 */
export const MILESTONES: MilestoneDef[] = [
  {
    id: "genesis",
    index: 0,
    code: "01",
    title: "Genesis",
    blurb: "5,460 units open at launch. No vote.",
    amount: 5_460,
    supplyAfter: 5_460,
    isGenesis: true,
    goals: [
      {
        id: "deploy",
        label: "DUST-20 deploy confirmed on mainnet (txid + inscription id public)",
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
    blurb: "Site, rules, and treasury are public for ≥ 14 days.",
    amount: 600,
    supplyAfter: 6_060,
    isGenesis: false,
    goals: [
      {
        id: "age",
        label: "Days since deploy confirmation",
        kind: "ratio",
        target: 14,
        formula: "Age ≥ 14D",
      },
      {
        id: "site",
        label: "Public page live: supply, roadmap, treasury, mint history, votes",
        kind: "boolean",
        formula: "Site = Live",
      },
      {
        id: "rules",
        label: "All 12 milestone rules published (immutable copy on site)",
        kind: "boolean",
        formula: "Rules = Public",
      },
      {
        id: "treasury",
        label: "Treasury mainnet address published",
        kind: "boolean",
        formula: "Treasury ≠ ∅",
      },
    ],
    quorum: 0.15,
    approval: 0.55,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m2",
    index: 2,
    code: "03",
    title: "100 holders",
    blurb: "≥ 100 holders outside team wallets; 50 of them held ≥ 14 days.",
    amount: 1_200,
    supplyAfter: 7_260,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders excluding team addresses",
        kind: "ratio",
        target: 100,
        formula: "H_ex ≥ 100",
      },
      {
        id: "holders14",
        label: "Holders with balance ≥ 14 consecutive days (ex-team)",
        kind: "ratio",
        target: 50,
        formula: "H₁₄d ≥ 50",
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
    title: "Spread",
    blurb: "250 holders, 100 sticky 30d, top-10 non-team ≤ 50%.",
    amount: 1_800,
    supplyAfter: 9_060,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 250,
        formula: "H ≥ 250",
      },
      {
        id: "holders30",
        label: "Holders with balance ≥ 30 consecutive days",
        kind: "ratio",
        target: 100,
        formula: "H₃₀d ≥ 100",
      },
      {
        id: "top10",
        label: "Share held by top 10 non-team wallets",
        kind: "inverse_ratio",
        target: 50,
        formula: "C_top10 ≤ 50%",
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
    title: "First product",
    blurb: "A live product; ≥ 50 wallets used it; ≥ 300 holders.",
    amount: 2_500,
    supplyAfter: 11_560,
    isGenesis: false,
    goals: [
      {
        id: "utility",
        label: "SATDUST product URL live + accepts on-chain / signed actions",
        kind: "boolean",
        formula: "Product = Live",
      },
      {
        id: "users",
        label: "Unique wallets with ≥ 1 recorded product action",
        kind: "ratio",
        target: 50,
        formula: "U ≥ 50",
      },
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 300,
        formula: "H ≥ 300",
      },
    ],
    quorum: 0.2,
    approval: 0.6,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m5",
    index: 5,
    code: "06",
    title: "Come back",
    blurb: "500 holders; 150 users; 50 wallets active on 2+ distinct UTC days.",
    amount: 3_200,
    supplyAfter: 14_760,
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
        id: "users",
        label: "Unique product users",
        kind: "ratio",
        target: 150,
        formula: "U ≥ 150",
      },
      {
        id: "returning",
        label: "Wallets with product actions on ≥ 2 distinct UTC days",
        kind: "ratio",
        target: 50,
        formula: "U_ret ≥ 50",
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
    title: "Depth",
    blurb: "800 holders; 300 held 30d; 300 users; top-10 non-team ≤ 45%.",
    amount: 3_800,
    supplyAfter: 18_560,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 800,
        formula: "H ≥ 800",
      },
      {
        id: "holders30",
        label: "Holders with balance ≥ 30 consecutive days",
        kind: "ratio",
        target: 300,
        formula: "H₃₀d ≥ 300",
      },
      {
        id: "users",
        label: "Unique product users",
        kind: "ratio",
        target: 300,
        formula: "U ≥ 300",
      },
      {
        id: "top10",
        label: "Share held by top 10 non-team wallets",
        kind: "inverse_ratio",
        target: 45,
        formula: "C_top10 ≤ 45%",
      },
    ],
    quorum: 0.25,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m7",
    index: 7,
    code: "08",
    title: "Outside signal",
    blurb: "1,200 holders + any 2 external proofs (users / integration / revenue / proposal).",
    amount: 4_400,
    supplyAfter: 22_960,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 1_200,
        formula: "H ≥ 1200",
      },
      {
        id: "external",
        label: "Hit any 2 outside signals",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(A…E)",
        options: [
          "A · Product users ≥ 500",
          "B · ≥ 1 independent SATDUST integration (public repo or mainnet tx proof)",
          "C · Cumulative product revenue ≥ 0.05 BTC to published treasury",
          "D · ≥ 1 community-authored proposal executed on-chain / published",
          "E · Returning users ≥ 150",
        ],
      },
    ],
    quorum: 0.25,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_MID,
  },
  {
    id: "m8",
    index: 8,
    code: "09",
    title: "Scale",
    blurb: "2,000 holders; 750 users; 200 returning; 800 held ≥ 30 days.",
    amount: 5_000,
    supplyAfter: 27_960,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 2_000,
        formula: "H ≥ 2000",
      },
      {
        id: "users",
        label: "Unique product users",
        kind: "ratio",
        target: 750,
        formula: "U ≥ 750",
      },
      {
        id: "returning",
        label: "Wallets with product actions on ≥ 2 distinct UTC days",
        kind: "ratio",
        target: 200,
        formula: "U_ret ≥ 200",
      },
      {
        id: "holders30",
        label: "Holders with balance ≥ 30 consecutive days",
        kind: "ratio",
        target: 800,
        formula: "H₃₀d ≥ 800",
      },
    ],
    quorum: 0.3,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_MID,
  },
  {
    id: "m9",
    index: 9,
    code: "10",
    title: "Market proof",
    blurb: "3,000 holders + any 2: volume, integrations, revenue, retention, age.",
    amount: 5_700,
    supplyAfter: 33_660,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 3_000,
        formula: "H ≥ 3000",
      },
      {
        id: "market",
        label: "Hit any 2 market proofs",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(A…E)",
        options: [
          "A · Cumulative SATDUST⇄BTC trade volume ≥ 1 BTC notional (indexed)",
          "B · ≥ 2 independent integrations with public proof",
          "C · Cumulative product revenue ≥ 0.2 BTC to treasury",
          "D · Returning users ≥ 400",
          "E · Days since deploy ≥ 120",
        ],
      },
    ],
    quorum: 0.3,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_MID,
  },
  {
    id: "m10",
    index: 10,
    code: "11",
    title: "Wide base",
    blurb: "4,500 holders; 1,500 sticky 30d; 1,500 users; top-10 ≤ 40%.",
    amount: 6_400,
    supplyAfter: 40_060,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 4_500,
        formula: "H ≥ 4500",
      },
      {
        id: "holders30",
        label: "Holders with balance ≥ 30 consecutive days",
        kind: "ratio",
        target: 1_500,
        formula: "H₃₀d ≥ 1500",
      },
      {
        id: "users",
        label: "Unique product users",
        kind: "ratio",
        target: 1_500,
        formula: "U ≥ 1500",
      },
      {
        id: "top10",
        label: "Share held by top 10 non-team wallets",
        kind: "inverse_ratio",
        target: 40,
        formula: "C_top10 ≤ 40%",
      },
    ],
    quorum: 0.3,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m11",
    index: 11,
    code: "12",
    title: "Hard mode",
    blurb: "6,500 holders; 2,500 users; 800 returning; plus any 2 hard growth checks.",
    amount: 7_000,
    supplyAfter: 47_060,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 6_500,
        formula: "H ≥ 6500",
      },
      {
        id: "users",
        label: "Unique product users",
        kind: "ratio",
        target: 2_500,
        formula: "U ≥ 2500",
      },
      {
        id: "returning",
        label: "Wallets with product actions on ≥ 2 distinct UTC days",
        kind: "ratio",
        target: 800,
        formula: "U_ret ≥ 800",
      },
      {
        id: "growth",
        label: "Hit any 2 hard growth checks",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(A…D)",
        options: [
          "A · Cumulative product revenue ≥ 0.5 BTC to treasury",
          "B · ≥ 3 independent integrations with public proof",
          "C · ≥ 5 community proposals executed",
          "D · Days since deploy ≥ 240",
        ],
      },
    ],
    quorum: 0.35,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m12",
    index: 12,
    code: "13",
    title: "Full supply",
    blurb: "Last batch: 9,000 holders, deep retention, plus any 2 maturity checks.",
    amount: 7_540,
    supplyAfter: 54_600,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 9_000,
        formula: "H ≥ 9000",
      },
      {
        id: "holders30",
        label: "Holders with balance ≥ 30 consecutive days",
        kind: "ratio",
        target: 3_000,
        formula: "H₃₀d ≥ 3000",
      },
      {
        id: "users",
        label: "Unique product users",
        kind: "ratio",
        target: 4_000,
        formula: "U ≥ 4000",
      },
      {
        id: "returning",
        label: "Wallets with product actions on ≥ 2 distinct UTC days",
        kind: "ratio",
        target: 1_500,
        formula: "U_ret ≥ 1500",
      },
      {
        id: "maturity",
        label: "Hit any 2 maturity checks",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(A…D)",
        options: [
          "A · Cumulative product revenue ≥ 1 BTC to treasury",
          "B · ≥ 5 independent integrations with public proof",
          "C · Days since deploy ≥ 365",
          "D · Top 10 non-team share ≤ 35%",
        ],
      },
    ],
    quorum: 0.35,
    approval: 0.75,
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
