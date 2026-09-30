import { describe, expect, it } from "vitest";
import {
  VIRTUAL_PROGRESS_START_MS,
  virtualMintCountAt,
  displayMintProgress,
  VIRTUAL_CAP,
} from "./virtual-progress";

describe("virtualMintCountAt", () => {
  it("starts at 1 before campaign", () => {
    expect(virtualMintCountAt(VIRTUAL_PROGRESS_START_MS - 1)).toBe(1);
  });

  it("reaches ~568 in ten minutes", () => {
    const t = VIRTUAL_PROGRESS_START_MS + 10 * 60 * 1000;
    const n = virtualMintCountAt(t);
    expect(n).toBeGreaterThanOrEqual(550);
    expect(n).toBeLessThanOrEqual(580);
  });

  it("caps at 4500 after 18h window", () => {
    const t = VIRTUAL_PROGRESS_START_MS + 19 * 60 * 60 * 1000;
    expect(virtualMintCountAt(t)).toBe(VIRTUAL_CAP);
  });
});

describe("displayMintProgress", () => {
  it("uses real count when higher than virtual", () => {
    const now = VIRTUAL_PROGRESS_START_MS + 60_000;
    const d = displayMintProgress(9000, now);
    expect(d.displayMinted).toBe(9000);
  });
});
