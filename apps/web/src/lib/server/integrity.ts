import "server-only";
import {
  assertMilestoneSum,
  GENESIS_SUPPLY,
  LIM_SATS,
  MAX_SATS,
  MILESTONES,
  MINT_USD,
  NETWORK,
  SUPPLY,
  UNIT_SATS,
} from "@satdust/shared";
import { PROJECT_ADDRESS } from "@satdust/shared/project";

export type IntegrityReport = {
  ok: boolean;
  checks: Array<{ id: string; pass: boolean; detail?: string }>;
};

/**
 * Redundant invariant checks for mint-critical constants.
 * Called from quote + prepare so a single corrupted import cannot silently mint.
 */
export function verifyMintIntegrity(): IntegrityReport {
  const checks: IntegrityReport["checks"] = [];

  const push = (id: string, pass: boolean, detail?: string) => {
    checks.push({ id, pass, detail });
  };

  push("network_mainnet", NETWORK === "mainnet", NETWORK);
  push("unit_sats_546", UNIT_SATS === 546, String(UNIT_SATS));
  push("lim_equals_unit", LIM_SATS === UNIT_SATS, String(LIM_SATS));
  push("supply_54600", SUPPLY === 54_600, String(SUPPLY));
  push("genesis_5460", GENESIS_SUPPLY === 5_460, String(GENESIS_SUPPLY));
  push(
    "max_sats",
    MAX_SATS === SUPPLY * UNIT_SATS,
    `${MAX_SATS} vs ${SUPPLY * UNIT_SATS}`
  );
  push("mint_usd_1", MINT_USD === 1, String(MINT_USD));
  push("milestone_count_20", MILESTONES.length === 20, String(MILESTONES.length));
  push("milestone_sum", assertMilestoneSum(), "sum(amount) === SUPPLY");
  push(
    "project_address_bc1",
    /^bc1[a-z0-9]{25,87}$/i.test(PROJECT_ADDRESS),
    PROJECT_ADDRESS.slice(0, 12) + "…"
  );

  return { ok: checks.every((c) => c.pass), checks };
}

export function assertMintIntegrity(): void {
  const report = verifyMintIntegrity();
  if (!report.ok) {
    const failed = report.checks.filter((c) => !c.pass).map((c) => c.id);
    throw new Error(`ABORT: mint integrity failed (${failed.join(", ")})`);
  }
}
