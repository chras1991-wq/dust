import { describe, expect, it } from "vitest";
import { UNIT_SATS } from "@satdust/shared";
import { PROJECT_ADDRESS } from "@satdust/shared/project";
import { assertPreBroadcast, buildRevealPlan } from "./index";

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
