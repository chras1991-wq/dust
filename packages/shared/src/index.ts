/**
 * SATDUST shared constants — production hard-coded values.
 * DUST-20 v1.1.0 (2026-09-01), Bitcoin mainnet, Experimental.
 */

export const DUST20_PROTOCOL = "dust-20" as const;
export const DUST20_VERSION = "1.1.0" as const;
export const DUST20_SPEC_DATE = "2026-09-01" as const;

export const NETWORK = "mainnet" as const;

export const TICK = "SATDUST" as const;
export const PROJECT_NAME = "SATDUST" as const;
export const SLOGAN = "Bitcoin Dust. Carried by Sats." as const;

/** Production project fee address — must match frontend constant. */
export const PROJECT_ADDRESS =
  "bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4" as const;

export const SUPPLY = 10_000;
export const UNIT_SATS = 546;
export const MAX_SATS = SUPPLY * UNIT_SATS; // 5_460_000
export const LIM_SATS = UNIT_SATS; // 546 → max 1 SATDUST per mint
export const MINT_AMT = 1;
export const MINT_USD = 7;

export const QUOTE_TTL_SECONDS = 60;

export const DEPLOY_PAYLOAD = {
  p: DUST20_PROTOCOL,
  op: "deploy",
  tick: TICK,
  supply: String(SUPPLY),
  unit_sats: String(UNIT_SATS),
  max_sats: String(MAX_SATS),
  lim_sats: String(LIM_SATS),
} as const;

export const MINT_PAYLOAD = {
  p: DUST20_PROTOCOL,
  op: "mint",
  tick: TICK,
  amt: String(MINT_AMT),
  sats: String(UNIT_SATS),
} as const;

/** Case-fold ticker identity per DUST-20 (SATDUST / satdust / SatDust ≡ same). */
export function normalizeTick(tick: string): string {
  return tick.trim().toUpperCase();
}

export function assertProjectAddress(address: string): boolean {
  return address === PROJECT_ADDRESS;
}

export type Network = typeof NETWORK;
