import { MINT_USD } from "@satdust/shared";

/** USD per 1 SATDUST at session open (mint × 1.38). */
export const OPEN_USD = MINT_USD * 1.38;
/** USD per 1 SATDUST at ramp deadline (mint × 14.7). */
export const TARGET_USD = MINT_USD * 14.7;

export type MinuteBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

function anchorMs(nowMs: number): number {
  const raw = process.env.INDEX_MARKET_ANCHOR_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Date.parse("2026-10-01T07:00:00.000Z");
}

/** Beijing 2026-10-01 19:00 → UTC 11:00. Override with INDEX_MARKET_TARGET_MS. */
function targetDeadlineMs(): number {
  const raw = process.env.INDEX_MARKET_TARGET_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Date.parse("2026-10-01T11:00:00.000Z");
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

function fairUsdAt(anchor: number, minuteIndex: number): number {
  const tMs = anchor + minuteIndex * 60_000;
  const deadline = targetDeadlineMs();
  if (tMs >= deadline) return TARGET_USD;
  const span = Math.max(60_000, deadline - anchor);
  const p = (tMs - anchor) / span;
  return OPEN_USD + (TARGET_USD - OPEN_USD) * smoothstep(p);
}

function isPreDeadline(anchor: number, minuteIndex: number): boolean {
  return anchor + minuteIndex * 60_000 < targetDeadlineMs();
}

type StreakState = { dir: 1 | -1; left: number };

function pickStreakLength(rnd: () => number): number {
  const u = rnd();
  if (u < 0.18) return 2;
  if (u < 0.38) return 3;
  if (u < 0.55) return 4;
  if (u < 0.68) return 5;
  if (u < 0.8) return 6;
  if (u < 0.9) return 7 + Math.floor(rnd() * 2);
  return 9 + Math.floor(rnd() * 4);
}

function rollStreak(
  state: StreakState,
  rnd: () => number,
  px: number,
  fair: number,
  recentHigh: number,
) {
  const gap = fair - px;
  const rel = gap / Math.max(0.01, fair);
  let pUp = 0.5;
  if (rel > 0.015) pUp = 0.52 + rnd() * 0.18;
  else if (rel < -0.015) pUp = 0.1 + rnd() * 0.22;
  else pUp = 0.4 + rnd() * 0.22;

  if (px >= recentHigh * 0.997) pUp *= 0.42 + rnd() * 0.25;
  if (px <= fair * 0.992) pUp *= 1.15 + rnd() * 0.2;

  state.dir = rnd() < Math.min(0.88, Math.max(0.12, pUp)) ? 1 : -1;
  state.left = pickStreakLength(rnd);
}

function priceBounds(anchor: number, minuteIndex: number, fair: number): { floor: number; cap: number } {
  const pre = isPreDeadline(anchor, minuteIndex);
  if (pre) {
    return {
      floor: Math.max(OPEN_USD * 0.96, fair * 0.9),
      cap: Math.min(TARGET_USD * 1.02, fair * 1.07 + 0.2),
    };
  }
  return { floor: TARGET_USD * 0.86, cap: TARGET_USD * 1.09 };
}

function generateBars(anchor: number, throughMinute: number): MinuteBar[] {
  const walkRnd = mulberry32(anchor ^ 0x9e3779b9);
  const state: StreakState = { dir: 1, left: pickStreakLength(walkRnd) };

  let prevClose = OPEN_USD;
  const bars: MinuteBar[] = [];
  const recentCloses: number[] = [OPEN_USD];

  for (let m = 0; m <= throughMinute; m++) {
    const rnd = mulberry32(anchor + m * 31_337);
    const fair = fairUsdAt(anchor, m);
    const recentHigh = Math.max(...recentCloses.slice(-10));
    const ramp = isPreDeadline(anchor, m);

    if (state.left <= 0) rollStreak(state, rnd, prevClose, fair, recentHigh);
    state.left -= 1;

    const vol =
      (ramp ? 0.032 : 0.022) +
      rnd() * (ramp ? 0.055 : 0.035) +
      (fair / TARGET_USD) * 0.015;
    const pull = (fair - prevClose) * (ramp ? 0.06 : 0.08);
    const leg = state.dir * vol * (0.75 + rnd() * 0.95);
    const shock = (rnd() - 0.5) * (0.035 + (fair / TARGET_USD) * 0.02);
    let close = prevClose + pull + leg + shock;

    const { floor, cap } = priceBounds(anchor, m, fair);
    close = Math.max(floor, Math.min(cap, close));

    const open =
      m === 0
        ? OPEN_USD
        : prevClose + (rnd() - 0.5) * (0.008 + rnd() * 0.014) * prevClose;

    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);
    const body = Math.max(0.0004, bodyHigh - bodyLow);
    const wickUp = (0.15 + rnd() * 0.85) * (body + 0.012);
    const wickDown = (0.15 + rnd() * 0.85) * (body + 0.012);

    bars.push({
      t: anchor + m * 60_000,
      o: roundUsd(open),
      h: roundUsd(Math.min(cap + 0.08, bodyHigh + wickUp)),
      l: roundUsd(Math.max(floor - 0.05, bodyLow - wickDown)),
      c: roundUsd(close),
    });

    prevClose = close;
    recentCloses.push(close);
    if (recentCloses.length > 16) recentCloses.shift();
  }

  return bars;
}

function roundUsd(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function marketSnapshot(nowMs: number = Date.now(), historyMinutes = 90): {
  minute: number;
  usdPerUnit: number;
  bars: MinuteBar[];
  targetUsd: number;
  targetAtMs: number;
} {
  const anchor = anchorMs(nowMs);
  const elapsed = Math.max(0, nowMs - anchor);
  const minute = Math.floor(elapsed / 60_000);
  const all = generateBars(anchor, minute);
  const usdPerUnit = all.length ? all[all.length - 1].c : OPEN_USD;
  const start = Math.max(0, all.length - historyMinutes);
  const bars = all.slice(start);
  return {
    minute,
    usdPerUnit,
    bars,
    targetUsd: TARGET_USD,
    targetAtMs: targetDeadlineMs(),
  };
}
