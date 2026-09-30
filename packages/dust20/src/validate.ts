import { normalizeTick } from "@satdust/shared";
import type {
  Dust20Deploy,
  Dust20Mint,
  MintCarrierCheck,
  ValidationIssue,
  ValidationResult,
} from "./types";

const ALLOWED_DEPLOY_KEYS = new Set([
  "p",
  "op",
  "tick",
  "supply",
  "unit_sats",
  "max_sats",
  "lim_sats",
]);

const ALLOWED_MINT_KEYS = new Set(["p", "op", "tick", "amt", "sats"]);

function issue(
  code: string,
  message: string,
  expected?: string,
  actual?: string
): ValidationIssue {
  return { code, message, expected, actual };
}

function isPositiveIntString(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

function result(issues: ValidationIssue[]): ValidationResult {
  return { valid: issues.length === 0, issues };
}

/**
 * Validate a DUST-20 deploy inscription payload.
 * First valid deployment for a case-folded ticker wins.
 */
export function validateDeploy(
  payload: Record<string, unknown>,
  opts?: { existingTickers?: string[] }
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const key of Object.keys(payload)) {
    if (!ALLOWED_DEPLOY_KEYS.has(key)) {
      issues.push(
        issue("INVALID_EXTRA_FIELD", `Unexpected field "${key}" in deploy payload`)
      );
    }
  }

  if (payload.p !== "dust-20") {
    issues.push(
      issue("INVALID_PROTOCOL", 'p must be "dust-20"', "dust-20", String(payload.p))
    );
  }
  if (payload.op !== "deploy") {
    issues.push(
      issue("INVALID_OP", 'op must be "deploy"', "deploy", String(payload.op))
    );
  }

  const tick = typeof payload.tick === "string" ? payload.tick : "";
  if (!tick) {
    issues.push(issue("MISSING_TICK", "tick is required"));
  } else if (opts?.existingTickers?.some((t) => normalizeTick(t) === normalizeTick(tick))) {
    issues.push(
      issue(
        "DUPLICATE_TICKER",
        `Ticker ${normalizeTick(tick)} already deployed (case-folded identity)`
      )
    );
  }

  const supply = String(payload.supply ?? "");
  const unitSats = String(payload.unit_sats ?? "");
  const maxSats = String(payload.max_sats ?? "");
  const limSats = String(payload.lim_sats ?? "");

  for (const [name, value] of [
    ["supply", supply],
    ["unit_sats", unitSats],
    ["max_sats", maxSats],
    ["lim_sats", limSats],
  ] as const) {
    if (!isPositiveIntString(value)) {
      issues.push(issue("INVALID_NUMERIC", `${name} must be a positive integer string`, undefined, value));
    }
  }

  if (
    isPositiveIntString(supply) &&
    isPositiveIntString(unitSats) &&
    isPositiveIntString(maxSats)
  ) {
    const expectedMax = BigInt(supply) * BigInt(unitSats);
    if (BigInt(maxSats) !== expectedMax) {
      issues.push(
        issue(
          "WRONG_MAX_SATS",
          "max_sats must equal supply × unit_sats",
          expectedMax.toString(),
          maxSats
        )
      );
    }
  }

  if (isPositiveIntString(limSats) && isPositiveIntString(unitSats)) {
    if (BigInt(limSats) % BigInt(unitSats) !== BigInt(0)) {
      issues.push(
        issue(
          "LIM_NOT_MULTIPLE",
          "lim_sats must be a multiple of unit_sats",
          `k × ${unitSats}`,
          limSats
        )
      );
    }
  }

  return result(issues);
}

/**
 * Validate a DUST-20 mint inscription payload against a known deploy.
 */
export function validateMintPayload(
  payload: Record<string, unknown>,
  deploy: Dust20Deploy
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const key of Object.keys(payload)) {
    if (!ALLOWED_MINT_KEYS.has(key)) {
      issues.push(
        issue("INVALID_EXTRA_FIELD", `Unexpected field "${key}" in mint payload`)
      );
    }
  }

  if (payload.p !== "dust-20") {
    issues.push(
      issue("INVALID_PROTOCOL", 'p must be "dust-20"', "dust-20", String(payload.p))
    );
  }
  if (payload.op !== "mint") {
    issues.push(issue("INVALID_OP", 'op must be "mint"', "mint", String(payload.op)));
  }

  const tick = typeof payload.tick === "string" ? payload.tick : "";
  if (normalizeTick(tick) !== normalizeTick(deploy.tick)) {
    issues.push(
      issue(
        "WRONG_TICKER",
        "mint tick must match deploy tick (case-folded)",
        normalizeTick(deploy.tick),
        normalizeTick(tick)
      )
    );
  }

  const amt = String(payload.amt ?? "");
  const sats = String(payload.sats ?? "");

  if (!isPositiveIntString(amt)) {
    issues.push(issue("INVALID_AMT", "amt must be a positive integer string", undefined, amt));
  }
  if (!isPositiveIntString(sats)) {
    issues.push(issue("INVALID_SATS", "sats must be a positive integer string", undefined, sats));
  }

  if (isPositiveIntString(amt) && isPositiveIntString(sats)) {
    const unit = BigInt(deploy.unit_sats);
    const expectedSats = BigInt(amt) * unit;
    if (BigInt(sats) !== expectedSats) {
      issues.push(
        issue(
          "AMT_SATS_MISMATCH",
          "sats must equal amt × unit_sats",
          expectedSats.toString(),
          sats
        )
      );
    }

    const lim = BigInt(deploy.lim_sats);
    if (BigInt(sats) > lim) {
      issues.push(
        issue(
          "EXCEEDS_LIM",
          "mint sats exceeds lim_sats",
          `≤ ${lim.toString()}`,
          sats
        )
      );
    }
  }

  return result(issues);
}

/**
 * Carrier output must equal declared sats; inscription at satoshi offset 0.
 * Off-by-one sat still confirms on Bitcoin but is INVALID at DUST-20 layer.
 */
export function validateMintCarrier(check: MintCarrierCheck): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (check.carrierOutputSats !== check.declaredSats) {
    issues.push(
      issue(
        "CARRIER_SATS_MISMATCH",
        "carrier output value must exactly equal declared sats",
        String(check.declaredSats),
        String(check.carrierOutputSats)
      )
    );
  }

  if (check.inscriptionOffset !== 0) {
    issues.push(
      issue(
        "OFFSET_NOT_ZERO",
        "inscription must be at satoshi offset 0 of the carrier output",
        "0",
        String(check.inscriptionOffset)
      )
    );
  }

  return result(issues);
}

/**
 * Full mint acceptance: payload + carrier + remaining supply.
 */
export function validateMintAcceptance(args: {
  payload: Record<string, unknown>;
  deploy: Dust20Deploy;
  carrier: MintCarrierCheck;
  mintedSupply: number;
}): ValidationResult {
  const issues: ValidationIssue[] = [
    ...validateMintPayload(args.payload, args.deploy).issues,
    ...validateMintCarrier(args.carrier).issues,
  ];

  const amt = Number(args.payload.amt);
  if (Number.isFinite(amt) && args.mintedSupply + amt > Number(args.deploy.supply)) {
    issues.push(
      issue(
        "SUPPLY_EXCEEDED",
        "mint would exceed deploy supply",
        args.deploy.supply,
        String(args.mintedSupply + amt)
      )
    );
  }

  return result(issues);
}

export function parseDeploy(payload: Record<string, unknown>): Dust20Deploy | null {
  const v = validateDeploy(payload);
  if (!v.valid) return null;
  return {
    p: "dust-20",
    op: "deploy",
    tick: String(payload.tick),
    supply: String(payload.supply),
    unit_sats: String(payload.unit_sats),
    max_sats: String(payload.max_sats),
    lim_sats: String(payload.lim_sats),
  };
}

export function parseMint(payload: Record<string, unknown>): Dust20Mint | null {
  if (payload.p !== "dust-20" || payload.op !== "mint") return null;
  return {
    p: "dust-20",
    op: "mint",
    tick: String(payload.tick ?? ""),
    amt: String(payload.amt ?? ""),
    sats: String(payload.sats ?? ""),
  };
}
