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
    expect(virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 30_000)).toBe(VIRTUAL_FLOOR);
  });

  it("only moves in steps (integer plateaus)", () => {
    const t0 = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 5_000);
    const t1 = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 12_000);
    const t2 = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 45_000);
    expect(t0).toBe(VIRTUAL_FLOOR);
    expect(t2).toBeGreaterThanOrEqual(t1);
    expect(t2 % 1).toBe(0);
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
