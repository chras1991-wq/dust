/**
 * Public site constants only — safe to import from any layer.
 * Secrets live in `@/lib/server/secrets` (server-only).
 */
import {
  DEPLOY_PAYLOAD,
  MINT_USD,
  NETWORK,
  SUPPLY,
  TICK,
  UNIT_SATS,
  DUST20_PROTOCOL,
  DUST20_VERSION,
} from "@satdust/shared";

export const SITE = {
  name: "SATDUST",
  tick: TICK,
  slogan: "Bitcoin Dust. Carried by Sats.",
  network: NETWORK,
  protocol: DUST20_PROTOCOL,
  protocolVersion: DUST20_VERSION,
  supply: SUPPLY,
  unitSats: UNIT_SATS,
  mintUsd: MINT_USD,
  deploy: DEPLOY_PAYLOAD,
} as const;

export function isMainnetEnforced(): boolean {
  return (process.env.NETWORK || "mainnet") === "mainnet";
}
