import { describe, expect, it } from "vitest";
import {
  VIRTUAL_FLOOR,
  VIRTUAL_PROGRESS_START_MS,
  virtualMintCountAt,
  displayMintProgress,
  VIRTUAL_CAP,
  VIRTUAL_WINDOW_MS,
} from "./virtual-progress";

describe("virtualMintCountAt", () => {
  it("starts at 1000 at campaign anchor", () => {
    expect(virtualMintCountAt(VIRTUAL_PROGRESS_START_MS)).toBe(VIRTUAL_FLOOR);
    expect(virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 8_000)).toBe(VIRTUAL_FLOOR);
  });

  it("alternates pauses and movement inside a few minutes", () => {
    const origin = VIRTUAL_PROGRESS_START_MS + 25 * 60_000;
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
    const t0 = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 5_000);
    const t1 = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 12_000);
    const t2 = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 45_000);
    expect(t0).toBe(VIRTUAL_FLOOR);
    expect(t2).toBeGreaterThanOrEqual(t1);
    expect(t2 % 1).toBe(0);
  });

  it("stays near the floor in the first minutes of the 18h window", () => {
    const fiveMin = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 5 * 60_000);
    const thirtyMin = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 30 * 60_000);
    const twoHours = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 2 * 60 * 60_000);
    expect(fiveMin).toBeLessThan(VIRTUAL_FLOOR + 80);
    expect(thirtyMin).toBeLessThan(VIRTUAL_FLOOR + 250);
    expect(twoHours).toBeGreaterThan(VIRTUAL_FLOOR);
    expect(twoHours).toBeLessThan(VIRTUAL_FLOOR + 900);
  });

  it("is monotonic and identical for the same timestamp", () => {
    const t = VIRTUAL_PROGRESS_START_MS + 3 * 60 * 60_000;
    expect(virtualMintCountAt(t)).toBe(virtualMintCountAt(t));
    expect(virtualMintCountAt(t + 60_000)).toBeGreaterThanOrEqual(virtualMintCountAt(t));
  });

  it("caps at 4500 after 18h window", () => {
    const t = VIRTUAL_PROGRESS_START_MS + VIRTUAL_WINDOW_MS + 60_000;
    expect(virtualMintCountAt(t)).toBe(VIRTUAL_CAP);
  });
});

describe("displayMintProgress", () => {
  it("uses real count when higher than virtual before cap", () => {
    const now = VIRTUAL_PROGRESS_START_MS + 60_000;
    const d = displayMintProgress(9000, now);
    expect(d.displayMinted).toBe(9000);
  });

  it("ignores real mint after virtual cap and adds post-cap bonus", () => {
    const now = VIRTUAL_PROGRESS_START_MS + VIRTUAL_WINDOW_MS + 2 * 60 * 60 * 1000;
    const d = displayMintProgress(50_000, now);
    expect(d.displayMinted).toBeGreaterThan(VIRTUAL_CAP);
    expect(d.displayMinted).toBeLessThan(VIRTUAL_CAP + 400);
    expect(d.displayMinted).not.toBe(50_000);
  });
});
