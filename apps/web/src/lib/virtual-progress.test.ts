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

  it("stays flat between discrete events then jumps", () => {
    const a = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 60_000);
    const b = virtualMintCountAt(VIRTUAL_PROGRESS_START_MS + 90_000);
    expect(a).toBe(VIRTUAL_FLOOR);
    expect(b).toBeGreaterThanOrEqual(VIRTUAL_FLOOR);
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
