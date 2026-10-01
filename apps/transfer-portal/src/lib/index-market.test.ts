import { marketSnapshot, OPEN_USD, PLATEAU_USD, RAMP_MINUTES } from "@/lib/index-market";
import { describe, expect, it } from "vitest";

const ANCHOR = Date.parse("2026-10-01T07:00:00.000Z");

describe("index market simulation", () => {
  it("opens at mint × 1.38", () => {
    process.env.INDEX_MARKET_ANCHOR_MS = String(ANCHOR);
    const snap = marketSnapshot(ANCHOR + 30_000, 5);
    expect(snap.usdPerUnit).toBeGreaterThanOrEqual(OPEN_USD * 0.98);
    expect(snap.usdPerUnit).toBeLessThanOrEqual(OPEN_USD * 1.08);
  });

  it("reaches ~300% of mint after 30 minutes", () => {
    process.env.INDEX_MARKET_ANCHOR_MS = String(ANCHOR);
    const snap = marketSnapshot(ANCHOR + RAMP_MINUTES * 60_000, 5);
    expect(snap.usdPerUnit).toBeGreaterThan(PLATEAU_USD * 0.9);
    expect(snap.usdPerUnit).toBeLessThan(PLATEAU_USD * 1.1);
  });

  it("emits one bar per minute", () => {
    process.env.INDEX_MARKET_ANCHOR_MS = String(ANCHOR);
    const snap = marketSnapshot(ANCHOR + 5 * 60_000, 10);
    expect(snap.bars.length).toBe(6);
    expect(snap.bars[0]?.o).toBeGreaterThan(0);
  });
});
