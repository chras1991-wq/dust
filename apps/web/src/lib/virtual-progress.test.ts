import { describe, expect, it } from "vitest";
import {
  VIRTUAL_FLOOR,
  VIRTUAL_PROGRESS_START_MS,
  virtualMintCountAt,
  displayMintProgress,
  movingMintProgress,
  MINT_CLOCK_OFFSET_MS,
  MINT_PROGRESS_PAUSE,
  DRIFT_AT_MS,
  DRIFT_TARGET,
  DRIFT_WINDOW_MS,
  FAST_AT_MS,
  FAST_TARGET,
  FAST_WINDOW_MS,
  FILL_DISPLAY,
  JUMP_AT_MS,
  JUMP_DISPLAY,
  JUMP_PAUSE_MS,
  MARK_WINDOW_MS,
  SPRINT_DISPLAY_TARGET,
  SPRINT_REAL_SNAPSHOT,
  SPRINT_START_MS,
  SPRINT_VIRTUAL_TARGET,
  SPRINT_WINDOW_MS,
  VIRTUAL_CAP,
  VIRTUAL_WINDOW_MS,
} from "./virtual-progress";

/** Wall time that lands on a given point of the 18h curve after the overnight offset. */
function wall(elapsedMs: number): number {
  return VIRTUAL_PROGRESS_START_MS + MINT_CLOCK_OFFSET_MS + elapsedMs;
}

describe("virtualMintCountAt", () => {
  it("starts at 1000 at campaign anchor", () => {
    expect(virtualMintCountAt(wall(0))).toBe(VIRTUAL_FLOOR);
    expect(virtualMintCountAt(wall(8_000))).toBe(VIRTUAL_FLOOR);
  });

  it("alternates pauses and movement inside a few minutes", () => {
    const origin = wall(25 * 60_000);
    const samples: number[] = [];
    for (let sec = 0; sec <= 200; sec += 8) {
      samples.push(virtualMintCountAt(origin + sec * 1000));
    }
    let flats = 0;
    let rises = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i] === samples[i - 1]) flats += 1;
      if (samples[i]! > samples[i - 1]!) rises += 1;
    }
    expect(flats).toBeGreaterThan(2);
    expect(rises).toBeGreaterThan(1);
  });

  it("only moves in steps (integer plateaus)", () => {
    const t0 = virtualMintCountAt(wall(5_000));
    const t1 = virtualMintCountAt(wall(12_000));
    const t2 = virtualMintCountAt(wall(45_000));
    expect(t0).toBe(VIRTUAL_FLOOR);
    expect(t2).toBeGreaterThanOrEqual(t1);
    expect(t2 % 1).toBe(0);
  });

  it("stays near the floor in the first minutes of the 18h window", () => {
    const fiveMin = virtualMintCountAt(wall(5 * 60_000));
    const thirtyMin = virtualMintCountAt(wall(30 * 60_000));
    const twoHours = virtualMintCountAt(wall(2 * 60 * 60_000));
    expect(fiveMin).toBeLessThan(VIRTUAL_FLOOR + 80);
    expect(thirtyMin).toBeLessThan(VIRTUAL_FLOOR + 250);
    expect(twoHours).toBeGreaterThan(VIRTUAL_FLOOR);
    expect(twoHours).toBeLessThan(VIRTUAL_FLOOR + 900);
  });

  it("is monotonic and identical for the same timestamp", () => {
    const t = wall(3 * 60 * 60_000);
    expect(virtualMintCountAt(t)).toBe(virtualMintCountAt(t));
    expect(virtualMintCountAt(t + 60_000)).toBeGreaterThanOrEqual(virtualMintCountAt(t));
  });

  it("caps at 4500 after 18h window", () => {
    const t = wall(VIRTUAL_WINDOW_MS + 60_000);
    expect(virtualMintCountAt(t)).toBe(VIRTUAL_CAP);
  });
});

describe("displayMintProgress", () => {
  it("is running and continues from the frozen point", () => {
    expect(MINT_PROGRESS_PAUSE).toBeNull();
    const pauseAt = 1_790_767_020_903;
    const resumedAt = pauseAt + MINT_CLOCK_OFFSET_MS;
    expect(virtualMintCountAt(resumedAt)).toBe(1605);
    const d = displayMintProgress(78, resumedAt);
    expect(d.paused).toBe(false);
    expect(d.virtualMinted).toBe(1605);
    expect(d.displayMinted).toBe(1683);
    expect(d.displayMinted).toBe(movingMintProgress(78, resumedAt).displayMinted);
  });

  it("adds real mints on top of the virtual clock before cap", () => {
    const now = wall(60_000);
    const virtual = virtualMintCountAt(now);
    const d = movingMintProgress(25, now);
    expect(d.paused).toBe(false);
    expect(d.virtualMinted).toBe(virtual);
    expect(d.displayMinted).toBe(virtual + 25);
    expect(movingMintProgress(25, now).displayMinted).toBe(d.displayMinted);
  });

  it("climbs to 3000 within 10 minutes, then rises slowly", () => {
    const from = virtualMintCountAt(SPRINT_START_MS - 1);
    const start = virtualMintCountAt(SPRINT_START_MS);
    expect(start).toBeGreaterThanOrEqual(from);
    expect(start).toBeLessThan(SPRINT_VIRTUAL_TARGET);

    const samples: number[] = [];
    for (let sec = 0; sec <= 600; sec += 15) {
      samples.push(virtualMintCountAt(SPRINT_START_MS + sec * 1000));
    }
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]!);
    }
    const mid = virtualMintCountAt(SPRINT_START_MS + 5 * 60_000);
    expect(mid).toBeGreaterThan(start + 300);
    expect(mid).toBeLessThan(SPRINT_VIRTUAL_TARGET - 50);

    const almost = virtualMintCountAt(SPRINT_START_MS + SPRINT_WINDOW_MS - 20_000);
    expect(SPRINT_VIRTUAL_TARGET - almost).toBeLessThan(80);
    const landed = displayMintProgress(SPRINT_REAL_SNAPSHOT, SPRINT_START_MS + SPRINT_WINDOW_MS);
    expect(landed.virtualMinted).toBe(SPRINT_VIRTUAL_TARGET);
    expect(landed.displayMinted).toBe(SPRINT_DISPLAY_TARGET);

    const later = virtualMintCountAt(SPRINT_START_MS + SPRINT_WINDOW_MS + 30 * 60_000);
    expect(later).toBeGreaterThan(SPRINT_VIRTUAL_TARGET + 40);
    expect(later).toBeLessThan(SPRINT_VIRTUAL_TARGET + 180);
    const twoHours = virtualMintCountAt(SPRINT_START_MS + SPRINT_WINDOW_MS + 2 * 60 * 60_000);
    expect(twoHours).toBeGreaterThan(later);
    expect(twoHours).toBeLessThan(VIRTUAL_CAP - 400);

    let biggest = 0;
    for (let i = 1; i < samples.length; i++) {
      biggest = Math.max(biggest, samples[i]! - samples[i - 1]!);
    }
    expect(biggest).toBeLessThan(120);
    expect(biggest).toBeGreaterThan(5);
  });

  it("jumps to 4317, pauses, then fills with uneven steps", () => {
    const held = displayMintProgress(9_999, JUMP_AT_MS + 30_000);
    expect(held.displayMinted).toBe(JUMP_DISPLAY);
    expect(held.paused).toBe(true);
    expect(held.realMinted).toBe(9_999);
    expect(displayMintProgress(1, JUMP_AT_MS + JUMP_PAUSE_MS - 1).displayMinted).toBe(JUMP_DISPLAY);

    const start = displayMintProgress(9_999, FAST_AT_MS);
    expect(start.displayMinted).toBeGreaterThan(JUMP_DISPLAY);
    expect(start.displayMinted).toBeLessThan(FAST_TARGET);
    expect(start.paused).toBe(false);

    const deltas: number[] = [];
    let prev = start.displayMinted;
    for (let sec = 0; sec <= FAST_WINDOW_MS / 1000; sec += 5) {
      const n = displayMintProgress(1, FAST_AT_MS + sec * 1000).displayMinted;
      expect(n).toBeGreaterThanOrEqual(prev);
      if (n > prev) deltas.push(n - prev);
      prev = n;
    }
    expect(deltas.some((d) => d >= 2 && d <= 9)).toBe(true);
    expect(deltas.some((d) => d >= 20)).toBe(true);
    const mid = displayMintProgress(1, FAST_AT_MS + 5 * 60_000).displayMinted;
    expect(mid).toBeGreaterThan(start.displayMinted + 150);
    expect(mid).toBeLessThan(FAST_TARGET);
    const landed = displayMintProgress(80_000, FAST_AT_MS + FAST_WINDOW_MS);
    expect(landed.displayMinted).toBe(FAST_TARGET);
    expect(landed.realMinted).toBe(80_000);

    const driftStart = displayMintProgress(1, DRIFT_AT_MS).displayMinted;
    expect(driftStart).toBeGreaterThan(FAST_TARGET);
    expect(driftStart).toBeLessThan(DRIFT_TARGET);
    const driftDeltas: number[] = [];
    let driftPrev = driftStart;
    for (let sec = 0; sec <= DRIFT_WINDOW_MS / 1000; sec += 10) {
      const n = displayMintProgress(1, DRIFT_AT_MS + sec * 1000).displayMinted;
      expect(n).toBeGreaterThanOrEqual(driftPrev);
      if (n > driftPrev) driftDeltas.push(n - driftPrev);
      driftPrev = n;
    }
    expect(driftDeltas.some((d) => d >= 2 && d <= 9)).toBe(true);
    expect(driftDeltas.every((d) => d <= 16)).toBe(true);
    const driftMid = displayMintProgress(1, DRIFT_AT_MS + 10 * 60_000).displayMinted;
    expect(driftMid).toBeGreaterThan(driftStart);
    expect(driftMid).toBeLessThan(DRIFT_TARGET);
    expect(displayMintProgress(90_000, DRIFT_AT_MS + DRIFT_WINDOW_MS).displayMinted).toBe(DRIFT_TARGET);

    const fillEnd = JUMP_AT_MS + JUMP_PAUSE_MS + MARK_WINDOW_MS + 5 * 60 * 60 * 1000;
    const done = displayMintProgress(50_000, fillEnd);
    expect(done.displayMinted).toBe(FILL_DISPLAY);
    expect(done.displayMinted).not.toBe(50_000);
  });

  it("ignores real mints once the desk is on the jumped schedule", () => {
    const now = wall(VIRTUAL_WINDOW_MS + 2 * 60 * 60 * 1000);
    const d = movingMintProgress(50_000, now);
    expect(d.displayMinted).toBe(FILL_DISPLAY);
    expect(d.displayMinted).not.toBe(50_000);
  });
});
