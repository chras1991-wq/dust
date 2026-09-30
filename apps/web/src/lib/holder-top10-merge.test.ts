import { describe, expect, it } from "vitest";
import { enforceDescending, mergeTop10Holders } from "./holder-top10-merge";

describe("mergeTop10Holders", () => {
  const synthAddr = (s: number) => `synth-${s}`;

  it("keeps a 500-bag real at #1 when ladder tops at 100", () => {
    const rows = mergeTop10Holders({
      reals: [{ address: "bc1realwhale", amount: 500 }],
      syntheticLadder: [100, 80, 60, 50, 40, 30, 25, 20, 15, 10],
      syntheticAddress: synthAddr,
      seed: 1,
    });
    expect(rows[0]!.address).toBe("bc1realwhale");
    expect(rows[0]!.amount).toBe(500);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.amount).toBeLessThanOrEqual(rows[i - 1]!.amount);
    }
  });

  it("includes all qualifying reals before synthetics", () => {
    const rows = mergeTop10Holders({
      reals: [
        { address: "a", amount: 300 },
        { address: "b", amount: 120 },
      ],
      syntheticLadder: [200, 150, 100, 90, 80, 70, 60, 50],
      syntheticAddress: synthAddr,
      seed: 2,
    });
    expect(rows.some((r) => r.address === "a" && r.amount === 300)).toBe(true);
    expect(rows.some((r) => r.address === "b" && r.amount === 120)).toBe(true);
    expect(rows[0]!.amount).toBe(300);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.amount).toBeLessThanOrEqual(rows[i - 1]!.amount);
    }
  });
});

describe("enforceDescending", () => {
  it("fixes synthetic above lower real", () => {
    const fixed = enforceDescending(
      [
        { address: "s", amount: 100, synthetic: true },
        { address: "r", amount: 300, synthetic: false },
      ],
      9
    );
    expect(fixed[0]!.amount).toBeGreaterThanOrEqual(fixed[1]!.amount);
  });
});
