import { getMilestoneView } from "@/lib/milestone-store";
import {
  VOTE_SATDUST_EQUIV_BTC,
  VOTE_PERIOD_DAYS,
  REVOTE_COOLDOWN_DAYS,
  GENESIS_SUPPLY,
  RESERVE_SUPPLY,
} from "@satdust/shared";
import { noStoreJson, rateLimit } from "@/lib/server/guard";
import { assertMintIntegrity } from "@/lib/server/integrity";
import { publicErrorMessage } from "@/lib/server/safe-error";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = rateLimit(req, "milestones", 60, 60_000);
  if (limited) return limited;

  try {
    assertMintIntegrity();
    const view = getMilestoneView();
    return noStoreJson({
      ...view,
      governance: {
        voteSatdustEquivBtc: VOTE_SATDUST_EQUIV_BTC,
        voteRule:
          "Vote if your SATDUST is worth ≥ 0.005 BTC at the live rate (snapshot). BTC alone does not qualify.",
        power: "1 eligible wallet = 1 vote",
        votePeriodDays: VOTE_PERIOD_DAYS,
        revoteCooldownDays: REVOTE_COOLDOWN_DAYS,
        snapshot: "Balances read at the proposal block height",
      },
      model: {
        genesis: GENESIS_SUPPLY,
        reserve: RESERVE_SUPPLY,
        rule: "Milestone done ≠ automatic mint. Vote still required.",
      },
    });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Milestones unavailable") },
      { status: 503 }
    );
  }
}
