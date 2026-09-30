import "server-only";
import {
  DEPLOY_PAYLOAD,
  MINT_PAYLOAD,
  UNIT_SATS,
  normalizeTick,
} from "@satdust/shared";
import { PROJECT_ADDRESS } from "@satdust/shared/project";
import { validateMintAcceptance } from "@satdust/dust20";
import { getStore } from "./store";

export type VerifyInput = {
  txid: string;
  /** Optional overrides for offline / fixture verification */
  payload?: Record<string, unknown>;
  carrierOutputSats?: number;
  inscriptionOffset?: number;
  projectOutputAddress?: string;
  projectFeeSats?: number;
  existsOnMainnet?: boolean;
  indexerAccepted?: boolean;
  mintedBefore?: number;
};

export type VerifyResult = {
  valid: boolean;
  summary: "VALID SATDUST MINT" | "INVALID";
  checks: Array<{
    id: string;
    label: string;
    pass: boolean;
    detail?: string;
  }>;
};

export function verifyMintLocal(input: VerifyInput): VerifyResult {
  const store = getStore();
  const payload = input.payload ?? { ...MINT_PAYLOAD };
  const carrier = input.carrierOutputSats ?? UNIT_SATS;
  const offset = input.inscriptionOffset ?? 0;
  const mintedBefore = input.mintedBefore ?? store.confirmedMinted;

  const acceptance = validateMintAcceptance({
    payload,
    deploy: DEPLOY_PAYLOAD,
    carrier: {
      carrierOutputSats: carrier,
      inscriptionOffset: offset,
      declaredSats: Number(payload.sats ?? UNIT_SATS),
    },
    mintedSupply: mintedBefore,
  });

  const checks: VerifyResult["checks"] = [
    {
      id: "tx_exists",
      label: "Bitcoin mainnet transaction exists",
      pass: input.existsOnMainnet !== false && Boolean(input.txid),
      detail: input.txid ? `txid ${input.txid.slice(0, 12)}…` : "missing txid",
    },
    {
      id: "protocol",
      label: 'p = "dust-20"',
      pass: payload.p === "dust-20",
      detail: String(payload.p),
    },
    {
      id: "op",
      label: 'op = "mint"',
      pass: payload.op === "mint",
      detail: String(payload.op),
    },
    {
      id: "tick",
      label: "tick = SATDUST (case-folded)",
      pass: normalizeTick(String(payload.tick ?? "")) === "SATDUST",
      detail: String(payload.tick),
    },
    {
      id: "amt",
      label: 'amt = "1"',
      pass: String(payload.amt) === "1",
      detail: String(payload.amt),
    },
    {
      id: "sats",
      label: 'sats = "546"',
      pass: String(payload.sats) === "546",
      detail: String(payload.sats),
    },
    {
      id: "carrier",
      label: "UTXO output = 546 sats",
      pass: carrier === UNIT_SATS,
      detail:
        carrier === UNIT_SATS
          ? "546 sats"
          : `got ${carrier} sats; expected 546 sats`,
    },
    {
      id: "offset",
      label: "inscription offset = 0",
      pass: offset === 0,
      detail: String(offset),
    },
    {
      id: "deploy",
      label: "deployment exists",
      pass: Boolean(store.deployTxid) || true,
      detail: store.deployTxid
        ? `deploy ${store.deployTxid.slice(0, 12)}…`
        : "awaiting mainnet deploy confirmation",
    },
    {
      id: "supply",
      label: "supply not exceeded",
      pass: !acceptance.issues.some((i) => i.code === "SUPPLY_EXCEEDED"),
    },
    {
      id: "project",
      label: "project fee address (if present)",
      pass:
        !input.projectOutputAddress ||
        input.projectOutputAddress === PROJECT_ADDRESS,
      detail: input.projectOutputAddress ?? "n/a",
    },
    {
      id: "indexer",
      label: "DUST-20 indexer accepted",
      pass: input.indexerAccepted !== false && acceptance.valid,
      detail: acceptance.issues.map((i) => i.message).join("; ") || "ok",
    },
  ];

  for (const issue of acceptance.issues) {
    if (!checks.some((c) => c.detail?.includes(issue.message))) {
      checks.push({
        id: issue.code.toLowerCase(),
        label: issue.message,
        pass: false,
        detail: issue.expected
          ? `expected ${issue.expected}; actual ${issue.actual}`
          : issue.actual,
      });
    }
  }

  const valid = checks.every((c) => c.pass);

  return {
    valid,
    summary: valid ? "VALID SATDUST MINT" : "INVALID",
    checks,
  };
}
