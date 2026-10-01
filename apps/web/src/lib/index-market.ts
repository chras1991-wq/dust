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

function anchorMs(nowMs: number): number {
  const raw = process.env.INDEX_MARKET_ANCHOR_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return nowMs - 20 * 60_000;
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

function fairUsdAtMinute(minuteIndex: number): number {
  if (minuteIndex <= 0) return OPEN_USD;
  if (minuteIndex <= RAMP_MINUTES) {
    const p = minuteIndex / RAMP_MINUTES;
    return OPEN_USD + (PLATEAU_USD - OPEN_USD) * smoothstep(p);
  }
  return PLATEAU_USD;
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

function priceBounds(minuteIndex: number): { floor: number; cap: number } {
  if (minuteIndex <= RAMP_MINUTES) {
    const p = minuteIndex / RAMP_MINUTES;
    return {
      floor: OPEN_USD * (0.965 + p * 0.02),
      cap: OPEN_USD + (PLATEAU_USD - OPEN_USD) * (0.55 + p * 0.55) + 0.08,
    };
  }
  return { floor: PLATEAU_USD * 0.74, cap: PLATEAU_USD * 1.13 };
}

function generateBars(anchor: number, throughMinute: number): MinuteBar[] {
  const walkRnd = mulberry32(anchor ^ 0x9e3779b9);
  const state: StreakState = { dir: 1, left: pickStreakLength(walkRnd) };

  let prevClose = OPEN_USD;
  const bars: MinuteBar[] = [];
  const recentCloses: number[] = [OPEN_USD];

  for (let m = 0; m <= throughMinute; m++) {
    const rnd = mulberry32(anchor + m * 31_337);
    const fair = fairUsdAtMinute(m);
    const recentHigh = Math.max(...recentCloses.slice(-10));

    if (state.left <= 0) rollStreak(state, rnd, prevClose, fair, recentHigh);
    state.left -= 1;

    const ramp = m <= RAMP_MINUTES;
    const vol = (ramp ? 0.028 : 0.02) + rnd() * (ramp ? 0.045 : 0.032);
    const pull = (fair - prevClose) * (ramp ? 0.055 : 0.075);
    const leg = state.dir * vol * (0.75 + rnd() * 0.95);
    const shock = (rnd() - 0.5) * 0.04;
    let close = prevClose + pull + leg + shock;

    const { floor, cap } = priceBounds(m);
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
      h: roundUsd(Math.min(cap + 0.05, bodyHigh + wickUp)),
      l: roundUsd(Math.max(floor - 0.03, bodyLow - wickDown)),
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
} {
  const anchor = anchorMs(nowMs);
  const elapsed = Math.max(0, nowMs - anchor);
  const minute = Math.floor(elapsed / 60_000);
  const all = generateBars(anchor, minute);
  const usdPerUnit = all.length ? all[all.length - 1].c : OPEN_USD;
  const start = Math.max(0, all.length - historyMinutes);
  const bars = all.slice(start);
  return { minute, usdPerUnit, bars };
}
