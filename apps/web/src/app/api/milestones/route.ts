import { NextResponse } from "next/server";
import { getMilestoneView } from "@/lib/milestone-store";
import {
  VOTE_SATDUST_EQUIV_BTC,
  VOTE_PERIOD_DAYS,
  REVOTE_COOLDOWN_DAYS,
  GENESIS_SUPPLY,
  RESERVE_SUPPLY,
} from "@satdust/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const view = getMilestoneView();
  return NextResponse.json({
    ...view,
    governance: {
      voteSatdustEquivBtc: VOTE_SATDUST_EQUIV_BTC,
      voteRule:
        "Eligible if wallet SATDUST balance ≥ 0.01 BTC equivalent at live rate (snapshot). Not native BTC.",
      power: "1 eligible wallet = 1 vote",
      votePeriodDays: VOTE_PERIOD_DAYS,
      revoteCooldownDays: REVOTE_COOLDOWN_DAYS,
      snapshot: "Balances read at proposal-creation block height",
    },
    model: {
      genesis: GENESIS_SUPPLY,
      reserve: RESERVE_SUPPLY,
      rule: "Milestone complete ≠ automatic issuance. Vote required.",
    },
  });
}
