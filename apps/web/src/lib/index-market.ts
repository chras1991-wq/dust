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

/** Script starts on this minute: one red candle, −30% of the price printed just before it. */
const SCRIPT_START_MS = Date.parse("2026-10-01T09:00:00.000Z");

type ScriptStep =
  | { kind: "smash"; drop: number }
  | { kind: "drift"; minutes: number; ret: number }
  | { kind: "range" };

/** −30% in one candle, chop 5m, −10%, choppy +2%, smash −16%, 10m choppy +20%, then range. */
const SCRIPT: ScriptStep[] = [
  { kind: "smash", drop: 0.3 },
  { kind: "drift", minutes: 5, ret: 0 },
  { kind: "smash", drop: 0.1 },
  { kind: "drift", minutes: 4, ret: 0.02 },
  { kind: "smash", drop: 0.16 },
  { kind: "drift", minutes: 10, ret: 0.2 },
  { kind: "range" },
];

function scriptMinute(anchor: number): number {
  return Math.max(0, Math.round((SCRIPT_START_MS - anchor) / 60_000));
}

function pushBar(
  bars: MinuteBar[],
  anchor: number,
  minuteIndex: number,
  open: number,
  close: number,
  wickUp: number,
  wickDown: number,
): number {
  const bodyHigh = Math.max(open, close);
  const bodyLow = Math.min(open, close);
  const high = bodyHigh + Math.max(0, wickUp);
  const low = Math.max(0.05, bodyLow - Math.max(0, wickDown));
  bars.push({
    t: anchor + minuteIndex * 60_000,
    o: roundUsd(open),
    h: roundUsd(high),
    l: roundUsd(low),
    c: roundUsd(close),
  });
  return close;
}

function smashBar(
  bars: MinuteBar[],
  anchor: number,
  minuteIndex: number,
  prevClose: number,
  drop: number,
  rnd: () => number,
): number {
  const open = prevClose;
  const close = prevClose * (1 - drop);
  const wickUp = open * (0.001 + rnd() * 0.004);
  const wickDown = close * (0.004 + rnd() * 0.012);
  return pushBar(bars, anchor, minuteIndex, open, close, wickUp, wickDown);
}

function driftBar(
  bars: MinuteBar[],
  anchor: number,
  minuteIndex: number,
  prevClose: number,
  target: number,
  barsLeft: number,
  rnd: () => number,
): number {
  const open = prevClose * (1 + (rnd() - 0.5) * 0.004);
  let close: number;
  if (barsLeft <= 3) {
    const gap = target - prevClose;
    close = prevClose + gap * (barsLeft === 1 ? 1 : 0.42 + rnd() * 0.2);
  } else if (Math.abs(target - prevClose) < target * 0.004) {
    close = prevClose * (1 + (rnd() - 0.5) * (0.006 + rnd() * 0.012));
  } else {
    const gap = target - prevClose;
    const toward = gap / barsLeft;
    const against = rnd() < 0.42;
    const raw = against ? -Math.abs(toward) * (0.4 + rnd() * 0.8) : toward * (0.55 + rnd() * 0.9);
    const cap = Math.max(Math.abs(toward) * 1.8, target * 0.008);
    const delta = Math.max(-cap, Math.min(cap, raw + target * (rnd() - 0.5) * 0.006));
    close = prevClose + delta;
  }
  const body = Math.abs(close - open);
  const wickUp = (0.2 + rnd() * 0.9) * (body + target * 0.002);
  const wickDown = (0.2 + rnd() * 0.9) * (body + target * 0.002);
  return pushBar(bars, anchor, minuteIndex, open, close, wickUp, wickDown);
}

function rangeBar(
  bars: MinuteBar[],
  anchor: number,
  minuteIndex: number,
  prevClose: number,
  center: number,
  rnd: () => number,
): number {
  const open = prevClose * (1 + (rnd() - 0.5) * 0.006);
  const pull = (center - prevClose) * (0.18 + rnd() * 0.35);
  const shock = center * (rnd() - 0.5) * (0.008 + rnd() * 0.018);
  let close = prevClose + pull + shock;
  close = Math.max(center * 0.96, Math.min(center * 1.04, close));
  const body = Math.abs(close - open);
  return pushBar(
    bars,
    anchor,
    minuteIndex,
    open,
    close,
    (0.25 + rnd()) * (body + center * 0.002),
    (0.25 + rnd()) * (body + center * 0.002),
  );
}

function generateBars(anchor: number, throughMinute: number): MinuteBar[] {
  const walkRnd = mulberry32(anchor ^ 0x9e3779b9);
  const state: StreakState = { dir: 1, left: pickStreakLength(walkRnd) };

  let prevClose = OPEN_USD;
  const bars: MinuteBar[] = [];
  const recentCloses: number[] = [OPEN_USD];
  const start = scriptMinute(anchor);
  let step = 0;
  let stepLeft = 0;
  let stepTarget = 0;
  let rangeCenter = 0;

  function beginStep(from: number) {
    const spec = SCRIPT[Math.min(step, SCRIPT.length - 1)];
    if (spec.kind === "smash") {
      stepLeft = 1;
      stepTarget = from * (1 - spec.drop);
    } else if (spec.kind === "drift") {
      stepLeft = spec.minutes;
      stepTarget = from * (1 + spec.ret);
    } else {
      stepLeft = 10_000;
      stepTarget = from;
      rangeCenter = from;
    }
  }

  for (let m = 0; m <= throughMinute; m++) {
    const rnd = mulberry32(anchor + m * 31_337);
    if (m < start) {
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
      const open = m === 0 ? OPEN_USD : prevClose + (rnd() - 0.5) * (0.008 + rnd() * 0.014) * prevClose;
      const bodyHigh = Math.max(open, close);
      const bodyLow = Math.min(open, close);
      const body = Math.max(0.0004, bodyHigh - bodyLow);
      prevClose = pushBar(
        bars,
        anchor,
        m,
        open,
        close,
        Math.min(cap + 0.08, bodyHigh + (0.15 + rnd() * 0.85) * (body + 0.012)) - bodyHigh,
        bodyLow - Math.max(floor - 0.05, bodyLow - (0.15 + rnd() * 0.85) * (body + 0.012)),
      );
      recentCloses.push(prevClose);
      if (recentCloses.length > 16) recentCloses.shift();
      continue;
    }

    if (stepLeft <= 0) {
      beginStep(prevClose);
    }
    const spec = SCRIPT[Math.min(step, SCRIPT.length - 1)];
    if (spec.kind === "smash") {
      prevClose = smashBar(bars, anchor, m, prevClose, spec.drop, rnd);
    } else if (spec.kind === "drift") {
      prevClose = driftBar(bars, anchor, m, prevClose, stepTarget, stepLeft, rnd);
    } else {
      prevClose = rangeBar(bars, anchor, m, prevClose, rangeCenter, rnd);
    }
    stepLeft -= 1;
    if (stepLeft <= 0 && spec.kind !== "range") step += 1;
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
