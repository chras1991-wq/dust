import {
  DEPLOY_PAYLOAD,
  MINT_USD,
  NETWORK,
  PROJECT_ADDRESS,
  SUPPLY,
  TICK,
  UNIT_SATS,
  DUST20_PROTOCOL,
  DUST20_VERSION,
} from "@satdust/shared";

export const SITE = {
  name: PROJECT_NAME_SAFE(),
  tick: TICK,
  slogan: "Bitcoin Dust. Carried by Sats.",
  network: NETWORK,
  protocol: DUST20_PROTOCOL,
  protocolVersion: DUST20_VERSION,
  projectAddress: PROJECT_ADDRESS,
  supply: SUPPLY,
  unitSats: UNIT_SATS,
  mintUsd: MINT_USD,
  deploy: DEPLOY_PAYLOAD,
} as const;

function PROJECT_NAME_SAFE() {
  return "SATDUST";
}

export function getQuoteSecret(): string {
  return process.env.QUOTE_SECRET || "satdust-dev-quote-secret-change-me";
}

export function isMainnetEnforced(): boolean {
  return (process.env.NETWORK || "mainnet") === "mainnet";
}
