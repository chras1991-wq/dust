import { describe, expect, it } from "vitest";
import {
  validateDeploy,
  validateMintAcceptance,
  validateMintCarrier,
  validateMintPayload,
} from "./validate";
import type { Dust20Deploy } from "./types";

const SATDUST_DEPLOY: Dust20Deploy = {
  p: "dust-20",
  op: "deploy",
  tick: "SATDUST",
  supply: "54600",
  unit_sats: "546",
  max_sats: "29811600",
  lim_sats: "546",
};

describe("validateDeploy", () => {
  it("accepts valid SATDUST deploy", () => {
    const r = validateDeploy({ ...SATDUST_DEPLOY });
    expect(r.valid).toBe(true);
  });

  it("rejects wrong max_sats", () => {
    const r = validateDeploy({ ...SATDUST_DEPLOY, max_sats: "5460001" });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "WRONG_MAX_SATS")).toBe(true);
  });

  it("rejects duplicate ticker (case-folded)", () => {
    const r = validateDeploy(
      { ...SATDUST_DEPLOY, tick: "satdust" },
      { existingTickers: ["SatDust"] }
    );
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "DUPLICATE_TICKER")).toBe(true);
  });

  it("rejects invalid extra field", () => {
    const r = validateDeploy({ ...SATDUST_DEPLOY, foo: "bar" });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "INVALID_EXTRA_FIELD")).toBe(true);
  });
});

describe("validateMintPayload", () => {
  it("accepts 1 × 546", () => {
    const r = validateMintPayload(
      { p: "dust-20", op: "mint", tick: "SATDUST", amt: "1", sats: "546" },
      SATDUST_DEPLOY
    );
    expect(r.valid).toBe(true);
  });

  it("rejects amt 2 due to lim_sats", () => {
    const r = validateMintPayload(
      { p: "dust-20", op: "mint", tick: "SATDUST", amt: "2", sats: "1092" },
      SATDUST_DEPLOY
    );
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "EXCEEDS_LIM")).toBe(true);
  });

  it("rejects wrong ticker", () => {
    const r = validateMintPayload(
      { p: "dust-20", op: "mint", tick: "OTHER", amt: "1", sats: "546" },
      SATDUST_DEPLOY
    );
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "WRONG_TICKER")).toBe(true);
  });
});

describe("validateMintCarrier", () => {
  it("rejects carrier 545", () => {
    const r = validateMintCarrier({
      carrierOutputSats: 545,
      inscriptionOffset: 0,
      declaredSats: 546,
    });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "CARRIER_SATS_MISMATCH")).toBe(true);
  });

  it("rejects carrier 547", () => {
    const r = validateMintCarrier({
      carrierOutputSats: 547,
      inscriptionOffset: 0,
      declaredSats: 546,
    });
    expect(r.valid).toBe(false);
  });

  it("rejects offset != 0", () => {
    const r = validateMintCarrier({
      carrierOutputSats: 546,
      inscriptionOffset: 1,
      declaredSats: 546,
    });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "OFFSET_NOT_ZERO")).toBe(true);
  });
});

describe("validateMintAcceptance / supply", () => {
  const payload = {
    p: "dust-20",
    op: "mint",
    tick: "SATDUST",
    amt: "1",
    sats: "546",
  };
  const carrier = {
    carrierOutputSats: 546,
    inscriptionOffset: 0,
    declaredSats: 546,
  };

  it("accepts mint near hard cap", () => {
    expect(
      validateMintAcceptance({
        payload,
        deploy: SATDUST_DEPLOY,
        carrier,
        mintedSupply: 54598,
      }).valid
    ).toBe(true);
    expect(
      validateMintAcceptance({
        payload,
        deploy: SATDUST_DEPLOY,
        carrier,
        mintedSupply: 54599,
      }).valid
    ).toBe(true);
  });

  it("rejects mint past hard cap", () => {
    const r = validateMintAcceptance({
      payload,
      deploy: SATDUST_DEPLOY,
      carrier,
      mintedSupply: 54600,
    });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "SUPPLY_EXCEEDED")).toBe(true);
  });
});
