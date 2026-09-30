import { describe, expect, it } from "vitest";
import { PROJECT_ADDRESS, UNIT_SATS } from "@satdust/shared";
import { assertPreBroadcast, buildRevealPlan, planSegwitSpend, segwitVbytes } from "./index";

describe("reveal plan", () => {
  it("places carrier at 546 and project fee next", () => {
    const plan = buildRevealPlan({
      userAddress: "bc1ptestuser",
      projectFeeSats: 7000,
      changeSats: 1000,
      minerFeeSats: 2000,
    });
    expect(plan.outputs[0]).toEqual({
      address: "bc1ptestuser",
      value: UNIT_SATS,
      role: "carrier",
    });
    expect(plan.outputs[1]).toEqual({
      address: PROJECT_ADDRESS,
      value: 7000,
      role: "project_fee",
    });
    expect(plan.outputs[2]?.role).toBe("change");
  });

  it("aborts on wrong project address", () => {
    expect(() =>
      buildRevealPlan({
        userAddress: "bc1ptestuser",
        projectFeeSats: 7000,
        changeSats: 0,
        minerFeeSats: 1000,
        projectAddress: "bc1qwrong",
      })
    ).toThrow(/ABORT/);
  });

  it("pre-broadcast asserts carrier and offset", () => {
    expect(() =>
      assertPreBroadcast({
        carrierOutputValue: 547,
        inscriptionOffset: 0,
        projectOutputAddress: PROJECT_ADDRESS,
      })
    ).toThrow(/546/);
    expect(() =>
      assertPreBroadcast({
        carrierOutputValue: 546,
        inscriptionOffset: 1,
        projectOutputAddress: PROJECT_ADDRESS,
      })
    ).toThrow(/offset/);
  });
});

describe("segwit spend plan", () => {
  const coin = { txid: "aa", vout: 0, value: 100_000 };

  it("keeps change when it clears dust", () => {
    const fee = segwitVbytes(1, 2) * 2;
    const plan = planSegwitSpend([coin], 10_000, 2);
    expect(fee).toBe(282);
    expect(plan.inputs).toEqual([coin]);
    expect(plan.fee).toBe(282);
    expect(plan.change).toBe(100_000 - 10_000 - 282);
  });

  it("folds dust change into the fee", () => {
    const plan = planSegwitSpend([coin], 99_500, 2);
    expect(plan.change).toBe(0);
    expect(plan.fee).toBe(500);
    expect(plan.inputs).toHaveLength(1);
  });

  it("rejects a short balance", () => {
    expect(() => planSegwitSpend([coin], 200_000, 2)).toThrow(/Insufficient bitcoin/);
  });
});
