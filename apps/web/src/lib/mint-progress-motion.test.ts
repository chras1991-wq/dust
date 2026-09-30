import { describe, expect, it } from "vitest";
import { humanMintChunk, nextRhythm, pickProgressMotion, type MotionRhythm } from "./mint-progress-motion";

describe("pickProgressMotion", () => {
  it("never exceeds remaining gap", () => {
    const rhythm = { mode: "active" as const, activeTicksLeft: 3 };
    for (let gap = 1; gap <= 200; gap += 7) {
      for (let i = 0; i < 40; i++) {
        const { delta } = pickProgressMotion(gap, rhythm);
        expect(delta).toBeGreaterThanOrEqual(0);
        expect(delta).toBeLessThanOrEqual(gap);
      }
    }
  });

  it("idle mode often pauses", () => {
    const rhythm = { mode: "idle" as const, activeTicksLeft: 0 };
    let pauses = 0;
    for (let i = 0; i < 120; i++) {
      if (pickProgressMotion(80, rhythm).delta === 0) pauses += 1;
    }
    expect(pauses).toBeGreaterThan(30);
  });
});

describe("humanMintChunk", () => {
  it("prefers round mint sizes", () => {
    const c = humanMintChunk(500, 42);
    expect([1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 500]).toContain(
      c
    );
  });
});

describe("nextRhythm", () => {
  it("enters active runs when behind", () => {
    let r: MotionRhythm = { mode: "idle", activeTicksLeft: 0 };
    let sawActive = false;
    for (let i = 0; i < 50; i++) {
      r = nextRhythm(r, 40);
      if (r.mode === "active") sawActive = true;
    }
    expect(sawActive).toBe(true);
  });
});
