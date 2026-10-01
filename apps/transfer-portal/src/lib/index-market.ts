import { MINT_USD } from "@satdust/shared";

/** USD per 1 unit at t=0 (mint × 1.38). */
export const OPEN_USD = MINT_USD * 1.38;
/** USD per 1 unit after ramp (mint × 3). */
export const PLATEAU_USD = MINT_USD * 3;
export const RAMP_MINUTES = 30;

export type MinuteBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

function anchorMs(_nowMs: number): number {
  const raw = process.env.INDEX_MARKET_ANCHOR_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  // Default anchor: feature epoch (deterministic for all visitors).
  return Date.parse("2026-10-01T07:00:00.000Z");
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

function minuteClose(anchor: number, minuteIndex: number): number {
  if (minuteIndex < 0) return OPEN_USD;
  const rnd = mulberry32(anchor / 60_000 + minuteIndex * 9_173);
  if (minuteIndex <= RAMP_MINUTES) {
    const p = minuteIndex / RAMP_MINUTES;
    const trend = OPEN_USD + (PLATEAU_USD - OPEN_USD) * smoothstep(p);
    const wave = Math.sin(minuteIndex / 2.7) * 0.035 * (0.35 + p);
    const noise = (rnd() - 0.5) * 0.06 * (0.4 + p);
    return Math.max(OPEN_USD * 0.98, trend + wave + noise);
  }

  const prev = minuteClose(anchor, minuteIndex - 1);
  const pull = (PLATEAU_USD - prev) * 0.22;
  const micro = Math.sin(minuteIndex / 3.1) * 0.04 + Math.sin(minuteIndex / 11) * 0.025;
  const shock = (rnd() - 0.5) * 0.09;
  const next = prev + pull + micro + shock;
  return Math.max(PLATEAU_USD * 0.72, Math.min(PLATEAU_USD * 1.12, next));
}

function minuteBar(anchor: number, minuteIndex: number): MinuteBar {
  const rnd = mulberry32(anchor + minuteIndex * 31_337);
  const prevClose = minuteIndex > 0 ? minuteClose(anchor, minuteIndex - 1) : OPEN_USD;
  const close = minuteClose(anchor, minuteIndex);
  const open = minuteIndex > 0 ? prevClose : OPEN_USD;
  const bodyHigh = Math.max(open, close);
  const bodyLow = Math.min(open, close);
  const wickUp = rnd() * 0.045;
  const wickDown = rnd() * 0.045;
  return {
    t: anchor + minuteIndex * 60_000,
    o: roundUsd(open),
    h: roundUsd(bodyHigh + wickUp),
    l: roundUsd(Math.max(OPEN_USD * 0.95, bodyLow - wickDown)),
    c: roundUsd(close),
  };
}

function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function marketSnapshot(nowMs: number = Date.now(), historyMinutes = 90): {
  minute: number;
  usdPerUnit: number;
  bars: MinuteBar[];
} {
  const anchor = anchorMs(nowMs);
  const elapsed = Math.max(0, nowMs - anchor);
  const minute = Math.floor(elapsed / 60_000);
  const usdPerUnit = minuteBar(anchor, minute).c;
  const start = Math.max(0, minute - historyMinutes + 1);
  const bars: MinuteBar[] = [];
  for (let m = start; m <= minute; m++) bars.push(minuteBar(anchor, m));
  return { minute, usdPerUnit, bars };
}
