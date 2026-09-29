/**
 * SATDUST milestone mint — supply opens only after hard, measurable progress + vote.
 *
 * S_max = 54_600
 * S_0   = 5_460  (Genesis)
 * 19 voted stages; later batches are larger and require much harder gates
 * (secondary market cap, stake TVL, agents, AMM depth, vote turnout, …).
 *
 * Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)
 *
 * Market-cap goals use live SATDUST secondary price × circulating units
 * (not the $1 mint-fee mark). Large unlocks need ≥ $5M circ MC.
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
export const MINT_COOLDOWN_DAYS_EARLY = 21;
export const MINT_COOLDOWN_DAYS_MID = 30;
export const MINT_COOLDOWN_DAYS_LATE = 45;
export const MINT_COOLDOWN_DAYS_FINAL = 60;

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
  | "m12"
  | "m13"
  | "m14"
  | "m15"
  | "m16"
  | "m17"
  | "m18"
  | "m19";

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
  target?: number;
  formula: string;
  options?: string[];
  need?: number;
};

export type MilestoneDef = {
  id: MilestoneId;
  index: number;
  code: string;
  title: string;
  blurb: string;
  amount: number;
  supplyAfter: number;
  isGenesis: boolean;
  goals: MilestoneGoalDef[];
  quorum: number;
  approval: number;
  cooldownDays: number;
};

/**
 * Genesis 5,460 + 19 voted batches (strictly increasing) → 54,600.
 * 400…6340 sum to 49,140.
 */
export const MILESTONES: MilestoneDef[] = [
  {
    id: "genesis",
    index: 0,
    code: "01",
    title: "Genesis",
    blurb: "5,460 SATDUST open at launch. No vote.",
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
    title: "Rails live",
    blurb: "Public rails for ≥ 21 days: site, rules, treasury, mint history, indexer status.",
    amount: 400,
    supplyAfter: 5_860,
    isGenesis: false,
    goals: [
      {
        id: "age",
        label: "Days since deploy confirmation",
        kind: "ratio",
        target: 21,
        formula: "Age ≥ 21D",
      },
      {
        id: "site",
        label: "Public page live: supply, roadmap, treasury, mint history, votes, indexer link",
        kind: "boolean",
        formula: "Site = Live",
      },
      {
        id: "rules",
        label: "All 20 milestone rules published and hash-pinned on site",
        kind: "boolean",
        formula: "Rules = Public",
      },
      {
        id: "treasury",
        label: "Treasury mainnet address published + first inbound fee tx visible",
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
    title: "200 holders",
    blurb: "≥ 200 ex-team holders; ≥ 100 held ≥ 14 days; top-10 non-team ≤ 55%.",
    amount: 600,
    supplyAfter: 6_460,
    isGenesis: false,
    goals: [
      {
        id: "holders",
        label: "Unique holders excluding published team addresses",
        kind: "ratio",
        target: 200,
        formula: "H_ex ≥ 200",
      },
      {
        id: "holders14",
        label: "Holders with balance ≥ 14 consecutive days (ex-team)",
        kind: "ratio",
        target: 100,
        formula: "H₁₄d ≥ 100",
      },
      {
        id: "top10",
        label: "Share held by top 10 non-team wallets",
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
    id: "m3",
    index: 3,
    code: "04",
    title: "First vote muscle",
    blurb: "Governance dry-run: ≥ 50 eligible voters snapshotted; ≥ 25% turnout on a test vote.",
    amount: 800,
    supplyAfter: 7_260,
    isGenesis: false,
    goals: [
      {
        id: "eligible",
        label: "Eligible voters at snapshot (SATDUST ≥ 0.005 BTC equiv)",
        kind: "ratio",
        target: 50,
        formula: "V_elig ≥ 50",
      },
      {
        id: "turnout",
        label: "Turnout on published test / governance vote (% of eligible)",
        kind: "ratio",
        target: 25,
        formula: "Turnout ≥ 25%",
      },
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 300,
        formula: "H ≥ 300",
      },
    ],
    quorum: 0.25,
    approval: 0.6,
    cooldownDays: MINT_COOLDOWN_DAYS_EARLY,
  },
  {
    id: "m4",
    index: 4,
    code: "05",
    title: "Stake desk online",
    blurb: "Stake module live; ≥ 250 SATDUST units locked; ≥ 40 distinct stakers.",
    amount: 1_000,
    supplyAfter: 8_260,
    isGenesis: false,
    goals: [
      {
        id: "stake_live",
        label: "Stake desk accepting locks (mainnet txs indexed)",
        kind: "boolean",
        formula: "Stake = Live",
      },
      {
        id: "staked",
        label: "SATDUST units currently locked in Stake",
        kind: "ratio",
        target: 250,
        formula: "Stake_TVL ≥ 250 units",
      },
      {
        id: "stakers",
        label: "Distinct wallets with active stake",
        kind: "ratio",
        target: 40,
        formula: "Stakers ≥ 40",
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
    title: "Agent fleet",
    blurb: "Agent desk live; ≥ 25 agents deployed; ≥ 15 wallets running an agent.",
    amount: 1_200,
    supplyAfter: 9_460,
    isGenesis: false,
    goals: [
      {
        id: "agent_live",
        label: "Agent desk accepting deployments (PSBT / on-chain proof)",
        kind: "boolean",
        formula: "Agent = Live",
      },
      {
        id: "agents",
        label: "Active agent deployments",
        kind: "ratio",
        target: 25,
        formula: "Agents ≥ 25",
      },
      {
        id: "agent_wallets",
        label: "Distinct wallets with ≥ 1 active agent",
        kind: "ratio",
        target: 15,
        formula: "AgentWallets ≥ 15",
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
    title: "Swap pool bootstrap",
    blurb: "Index swap pool live; BTC leg ≥ 0.5 BTC; SATDUST inventory ≥ 500 units.",
    amount: 1_400,
    supplyAfter: 10_860,
    isGenesis: false,
    goals: [
      {
        id: "pool_live",
        label: "SATDUST ⇄ BTC pool accepting swaps (indexed fills)",
        kind: "boolean",
        formula: "AMM = Live",
      },
      {
        id: "btc_depth",
        label: "BTC in AMM pool (spendable pool UTXOs)",
        kind: "ratio",
        target: 0.5,
        formula: "Pool_BTC ≥ 0.5 BTC",
      },
      {
        id: "token_depth",
        label: "SATDUST units held as pool inventory",
        kind: "ratio",
        target: 500,
        formula: "Pool_SATDUST ≥ 500 units",
      },
    ],
    quorum: 0.25,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_MID,
  },
  {
    id: "m7",
    index: 7,
    code: "08",
    title: "Retention base",
    blurb: "800 holders; 300 held 30d; 100 returning product users; top-10 ≤ 45%.",
    amount: 1_600,
    supplyAfter: 12_460,
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
        id: "returning",
        label: "Wallets with product actions on ≥ 2 distinct UTC days",
        kind: "ratio",
        target: 100,
        formula: "U_ret ≥ 100",
      },
      {
        id: "top10",
        label: "Share held by top 10 non-team wallets",
        kind: "inverse_ratio",
        target: 45,
        formula: "C_top10 ≤ 45%",
      },
    ],
    quorum: 0.3,
    approval: 0.66,
    cooldownDays: MINT_COOLDOWN_DAYS_MID,
  },
  {
    id: "m8",
    index: 8,
    code: "09",
    title: "Stake depth",
    blurb: "≥ 1,500 units staked; ≥ 120 stakers; ≥ 40% of circulating supply staked.",
    amount: 1_800,
    supplyAfter: 14_260,
    isGenesis: false,
    goals: [
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 1_500,
        formula: "Stake_TVL ≥ 1500 units",
      },
      {
        id: "stakers",
        label: "Distinct active stakers",
        kind: "ratio",
        target: 120,
        formula: "Stakers ≥ 120",
      },
      {
        id: "stake_ratio",
        label: "Staked units / circulating minted (%)",
        kind: "ratio",
        target: 40,
        formula: "Stake% ≥ 40%",
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
    title: "Agent network",
    blurb: "≥ 100 active agents; ≥ 60 operator wallets; mint-watch or rebalancer used on-chain.",
    amount: 2_000,
    supplyAfter: 16_260,
    isGenesis: false,
    goals: [
      {
        id: "agents",
        label: "Active agent deployments",
        kind: "ratio",
        target: 100,
        formula: "Agents ≥ 100",
      },
      {
        id: "agent_wallets",
        label: "Distinct wallets with ≥ 1 active agent",
        kind: "ratio",
        target: 60,
        formula: "AgentWallets ≥ 60",
      },
      {
        id: "agent_actions",
        label: "Indexed agent-requested PSBT executions (lifetime)",
        kind: "ratio",
        target: 200,
        formula: "AgentTx ≥ 200",
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
    title: "AMM depth I",
    blurb: "Pool ≥ 2 BTC + ≥ 2,000 SATDUST units; ≥ 500 completed swaps; 30d volume ≥ 5 BTC.",
    amount: 2_200,
    supplyAfter: 18_460,
    isGenesis: false,
    goals: [
      {
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 2,
        formula: "Pool_BTC ≥ 2 BTC",
      },
      {
        id: "token_depth",
        label: "SATDUST units in pool inventory",
        kind: "ratio",
        target: 2_000,
        formula: "Pool_SATDUST ≥ 2000 units",
      },
      {
        id: "swaps",
        label: "Completed indexed swaps (lifetime)",
        kind: "ratio",
        target: 500,
        formula: "Swaps ≥ 500",
      },
      {
        id: "vol30",
        label: "30-day swap notional (BTC)",
        kind: "ratio",
        target: 5,
        formula: "Vol_30d ≥ 5 BTC",
      },
    ],
    quorum: 0.3,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_MID,
  },
  {
    id: "m11",
    index: 11,
    code: "12",
    title: "Compute + auction",
    blurb: "Compute and Auction desks live with real collateral / cleared lots.",
    amount: 2_400,
    supplyAfter: 20_860,
    isGenesis: false,
    goals: [
      {
        id: "compute_live",
        label: "Compute desk: ≥ 50 TH/s committed against SATDUST collateral",
        kind: "ratio",
        target: 50,
        formula: "Compute ≥ 50 TH/s",
      },
      {
        id: "compute_bonds",
        label: "SATDUST units locked as compute collateral",
        kind: "ratio",
        target: 300,
        formula: "ComputeBond ≥ 300 units",
      },
      {
        id: "auction",
        label: "Auction lots cleared (paid + settled)",
        kind: "ratio",
        target: 5,
        formula: "AuctionsCleared ≥ 5",
      },
    ],
    quorum: 0.3,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m12",
    index: 12,
    code: "13",
    title: "Vote culture",
    blurb: "≥ 200 eligible voters; last mint proposal turnout ≥ 40%; approval ≥ 70% if passed.",
    amount: 2_600,
    supplyAfter: 23_460,
    isGenesis: false,
    goals: [
      {
        id: "eligible",
        label: "Eligible voters at latest proposal snapshot",
        kind: "ratio",
        target: 200,
        formula: "V_elig ≥ 200",
      },
      {
        id: "turnout",
        label: "Turnout on last mint / governance proposal",
        kind: "ratio",
        target: 40,
        formula: "Turnout ≥ 40%",
      },
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 1_500,
        formula: "H ≥ 1500",
      },
    ],
    quorum: 0.35,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m13",
    index: 13,
    code: "14",
    title: "MC $1M",
    blurb: "Circulating market cap ≥ $1,000,000 at live secondary price × minted units.",
    amount: 2_800,
    supplyAfter: 26_260,
    isGenesis: false,
    goals: [
      {
        id: "mcap",
        label: "Circulating MC (live SATDUST USD × minted units)",
        kind: "ratio",
        target: 1_000_000,
        formula: "CircMC ≥ $1,000,000",
      },
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 3_000,
        formula: "Stake_TVL ≥ 3000 units",
      },
      {
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 5,
        formula: "Pool_BTC ≥ 5 BTC",
      },
    ],
    quorum: 0.35,
    approval: 0.7,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m14",
    index: 14,
    code: "15",
    title: "Wide + liquid",
    blurb: "3,000 holders; pool ≥ 8 BTC; agents ≥ 250; 30d volume ≥ 20 BTC.",
    amount: 3_200,
    supplyAfter: 29_460,
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
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 8,
        formula: "Pool_BTC ≥ 8 BTC",
      },
      {
        id: "agents",
        label: "Active agent deployments",
        kind: "ratio",
        target: 250,
        formula: "Agents ≥ 250",
      },
      {
        id: "vol30",
        label: "30-day swap notional (BTC)",
        kind: "ratio",
        target: 20,
        formula: "Vol_30d ≥ 20 BTC",
      },
    ],
    quorum: 0.35,
    approval: 0.72,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m15",
    index: 15,
    code: "16",
    title: "MC $2.5M",
    blurb: "Circ MC ≥ $2.5M; stake ≥ 6,000 units; vote turnout ≥ 45% on last proposal.",
    amount: 3_600,
    supplyAfter: 33_060,
    isGenesis: false,
    goals: [
      {
        id: "mcap",
        label: "Circulating MC (live price × minted)",
        kind: "ratio",
        target: 2_500_000,
        formula: "CircMC ≥ $2,500,000",
      },
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 6_000,
        formula: "Stake_TVL ≥ 6000 units",
      },
      {
        id: "turnout",
        label: "Turnout on last mint proposal",
        kind: "ratio",
        target: 45,
        formula: "Turnout ≥ 45%",
      },
      {
        id: "top10",
        label: "Top 10 non-team share",
        kind: "inverse_ratio",
        target: 35,
        formula: "C_top10 ≤ 35%",
      },
    ],
    quorum: 0.35,
    approval: 0.72,
    cooldownDays: MINT_COOLDOWN_DAYS_LATE,
  },
  {
    id: "m16",
    index: 16,
    code: "17",
    title: "MC $5M gate",
    blurb: "Large unlock: circ MC ≥ $5,000,000 + deep stake/AMM/agent stack.",
    amount: 4_200,
    supplyAfter: 37_260,
    isGenesis: false,
    goals: [
      {
        id: "mcap",
        label: "Circulating MC (live price × minted)",
        kind: "ratio",
        target: 5_000_000,
        formula: "CircMC ≥ $5,000,000",
      },
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 10_000,
        formula: "Stake_TVL ≥ 10000 units",
      },
      {
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 15,
        formula: "Pool_BTC ≥ 15 BTC",
      },
      {
        id: "agents",
        label: "Active agent deployments",
        kind: "ratio",
        target: 500,
        formula: "Agents ≥ 500",
      },
      {
        id: "eligible",
        label: "Eligible voters at snapshot",
        kind: "ratio",
        target: 500,
        formula: "V_elig ≥ 500",
      },
    ],
    quorum: 0.4,
    approval: 0.75,
    cooldownDays: MINT_COOLDOWN_DAYS_FINAL,
  },
  {
    id: "m17",
    index: 17,
    code: "18",
    title: "MC $10M",
    blurb: "Circ MC ≥ $10M; pool ≥ 30 BTC; 30d volume ≥ 80 BTC; holders ≥ 8,000.",
    amount: 5_000,
    supplyAfter: 42_260,
    isGenesis: false,
    goals: [
      {
        id: "mcap",
        label: "Circulating MC (live price × minted)",
        kind: "ratio",
        target: 10_000_000,
        formula: "CircMC ≥ $10,000,000",
      },
      {
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 30,
        formula: "Pool_BTC ≥ 30 BTC",
      },
      {
        id: "vol30",
        label: "30-day swap notional (BTC)",
        kind: "ratio",
        target: 80,
        formula: "Vol_30d ≥ 80 BTC",
      },
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 8_000,
        formula: "H ≥ 8000",
      },
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 15_000,
        formula: "Stake_TVL ≥ 15000 units",
      },
    ],
    quorum: 0.4,
    approval: 0.75,
    cooldownDays: MINT_COOLDOWN_DAYS_FINAL,
  },
  {
    id: "m18",
    index: 18,
    code: "19",
    title: "MC $25M",
    blurb: "Circ MC ≥ $25M; agents ≥ 1,500; stake ≥ 20,000 units; turnout ≥ 50%.",
    amount: 6_000,
    supplyAfter: 48_260,
    isGenesis: false,
    goals: [
      {
        id: "mcap",
        label: "Circulating MC (live price × minted)",
        kind: "ratio",
        target: 25_000_000,
        formula: "CircMC ≥ $25,000,000",
      },
      {
        id: "agents",
        label: "Active agent deployments",
        kind: "ratio",
        target: 1_500,
        formula: "Agents ≥ 1500",
      },
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 20_000,
        formula: "Stake_TVL ≥ 20000 units",
      },
      {
        id: "turnout",
        label: "Turnout on last mint proposal",
        kind: "ratio",
        target: 50,
        formula: "Turnout ≥ 50%",
      },
      {
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 50,
        formula: "Pool_BTC ≥ 50 BTC",
      },
    ],
    quorum: 0.45,
    approval: 0.75,
    cooldownDays: MINT_COOLDOWN_DAYS_FINAL,
  },
  {
    id: "m19",
    index: 19,
    code: "20",
    title: "MC $50M · full open",
    blurb: "Final batch: circ MC ≥ $50M + maturity stack. Hardest gate in the curve.",
    amount: 6_340,
    supplyAfter: 54_600,
    isGenesis: false,
    goals: [
      {
        id: "mcap",
        label: "Circulating MC (live price × minted)",
        kind: "ratio",
        target: 50_000_000,
        formula: "CircMC ≥ $50,000,000",
      },
      {
        id: "holders",
        label: "Unique holders",
        kind: "ratio",
        target: 15_000,
        formula: "H ≥ 15000",
      },
      {
        id: "holders30",
        label: "Holders with balance ≥ 30 consecutive days",
        kind: "ratio",
        target: 5_000,
        formula: "H₃₀d ≥ 5000",
      },
      {
        id: "staked",
        label: "SATDUST units locked in Stake",
        kind: "ratio",
        target: 25_000,
        formula: "Stake_TVL ≥ 25000 units",
      },
      {
        id: "btc_depth",
        label: "BTC in AMM pool",
        kind: "ratio",
        target: 100,
        formula: "Pool_BTC ≥ 100 BTC",
      },
      {
        id: "agents",
        label: "Active agent deployments",
        kind: "ratio",
        target: 3_000,
        formula: "Agents ≥ 3000",
      },
      {
        id: "maturity",
        label: "Hit any 2 maturity checks",
        kind: "any_of",
        need: 2,
        formula: "AnyTwo(A…D)",
        options: [
          "A · 30d swap notional ≥ 200 BTC",
          "B · Days since deploy ≥ 540",
          "C · Top 10 non-team share ≤ 25%",
          "D · ≥ 10 independent SATDUST integrations with public proof",
        ],
      },
    ],
    quorum: 0.5,
    approval: 0.8,
    cooldownDays: MINT_COOLDOWN_DAYS_FINAL,
  },
];

export function getMilestone(id: MilestoneId): MilestoneDef {
  const m = MILESTONES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown milestone ${id}`);
  return m;
}

export function dilutionPct(amount: number, currentSupply: number): number {
  if (currentSupply <= 0) return 100;
  return (amount / currentSupply) * 100;
}

export function assertMilestoneSum(): boolean {
  const sum = MILESTONES.reduce((a, m) => a + m.amount, 0);
  return sum === SUPPLY_CAP;
}
