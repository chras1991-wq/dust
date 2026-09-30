import { describe, expect, it } from "vitest";
import { pickProgressMotion } from "./mint-progress-motion";

describe("pickProgressMotion", () => {
  it("never exceeds remaining gap", () => {
    for (let gap = 1; gap <= 200; gap += 7) {
      for (let i = 0; i < 40; i++) {
        const { delta } = pickProgressMotion(gap);
        expect(delta).toBeGreaterThanOrEqual(0);
        expect(delta).toBeLessThanOrEqual(gap);
      }
    }
  });

  it("sometimes pauses with zero delta", () => {
    let pauses = 0;
    for (let i = 0; i < 200; i++) {
      if (pickProgressMotion(80).delta === 0) pauses += 1;
    }
    expect(pauses).toBeGreaterThan(20);
  });

  it("sometimes moves more than one at a time", () => {
    let batches = 0;
    for (let i = 0; i < 200; i++) {
      if (pickProgressMotion(120).delta >= 4) batches += 1;
    }
    expect(batches).toBeGreaterThan(15);
  });
});
