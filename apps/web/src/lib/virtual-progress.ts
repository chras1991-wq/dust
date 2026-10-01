/**
 * Deterministic virtual mint progress — discrete jumps only (no smooth clock creep).
 * Re-anchored at 1000 from 2026-09-30 16:45 Beijing.
 */

export const VIRTUAL_PROGRESS_START_MS = Date.parse("2026-09-30T08:45:00.000Z");
export const VIRTUAL_FLOOR = 1000;
export const VIRTUAL_CAP = 4500;
/**
 * Wall-clock time removed from the 18h curve.
 * The overnight pause (frozen at 2026-09-30T11:17:00.903Z, resumed 2026-10-01T00:21:11.584Z)
 * is subtracted so the curve continues from 1,605 virtual + real mints
 * instead of skipping ahead through the night.
 */
export const MINT_CLOCK_OFFSET_MS = 47_050_681;
/**
 * Public counter pause. null = running under the rules above.
 * Wallet credits still save while a future pause is set.
 */
export const MINT_PROGRESS_PAUSE: {
  atMs: number;
  displayMinted: number;
  virtualMinted: number;
  realMinted: number;
} | null = null;
/**
 * Wall-clock start of the 10-minute climb. Before this, the resumed 18h curve
 * still runs. Public display target at the end of the climb is 3,000 when
 * real mints are still the snapshot below; later real mints add on top.
 */
export const SPRINT_START_MS = 1_790_817_723_811;
export const SPRINT_WINDOW_MS = 10 * 60 * 1000;
export const SPRINT_DISPLAY_TARGET = 3000;
export const SPRINT_REAL_SNAPSHOT = 432;
export const SPRINT_VIRTUAL_TARGET = SPRINT_DISPLAY_TARGET - SPRINT_REAL_SNAPSHOT;
/** 18h onboarding window after anchor. The slow parabola finishes here at 4,500. */
export const VIRTUAL_WINDOW_MS = 18 * 60 * 60 * 1000;
/** After 4500: display-only bonus in discrete steps. */
export const POST_CAP_WINDOW_MS = 5 * 60 * 60 * 1000;
export const POST_CAP_BONUS_MAX = 360;

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

function randInt(seed: number, min: number, max: number): number {
  const r = mulberry32(seed)();
  return min + Math.floor(r * (max - min + 1));
}

/** Ideal count on the 18h clock. Display never runs ahead of this. */
function curveCount(elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs / VIRTUAL_WINDOW_MS));
  const eased = 1 - (1 - t) ** 1.25;
  return VIRTUAL_FLOOR + Math.round((VIRTUAL_CAP - VIRTUAL_FLOOR) * eased);
}

/**
 * Each wave: quiet → faster → quiet (parabola), then a short rest.
 * Same timestamp → same count. Spends only the 18h budget.
 */
function clockMs(nowMs: number): number {
  return nowMs - MINT_CLOCK_OFFSET_MS;
}

function campaignWindowEndMs(): number {
  return VIRTUAL_PROGRESS_START_MS + MINT_CLOCK_OFFSET_MS + VIRTUAL_WINDOW_MS;
}

/** Curve that was running before the 10-minute climb. */
function legacyVirtualMintCount(nowMs: number): number {
  nowMs = clockMs(nowMs);
  if (nowMs < VIRTUAL_PROGRESS_START_MS) return VIRTUAL_FLOOR;

  const elapsed = nowMs - VIRTUAL_PROGRESS_START_MS;
  if (elapsed >= VIRTUAL_WINDOW_MS) return VIRTUAL_CAP;

  let t = 0;
  let count = VIRTUAL_FLOOR;
  let wave = 0;

  while (t < elapsed && count < VIRTUAL_CAP && wave < 4_000) {
    const cycle = randInt(wave + 400, 70_000, 130_000);
    const restHead = Math.round(cycle * (0.14 + mulberry32(wave + 7)() * 0.08));
    const restTail = Math.round(cycle * (0.16 + mulberry32(wave + 9)() * 0.1));
    const active = Math.max(24_000, cycle - restHead - restTail);
    const intensity = 0.65 + mulberry32(wave + 13)() * 0.7;

    if (t + restHead > elapsed) break;
    t += restHead;

    let activeCursor = 0;
    let tick = 0;
    while (activeCursor < active && t < elapsed && count < VIRTUAL_CAP && tick < 24) {
      const step = randInt(wave * 80 + tick + 11, 6_000, 13_000);
      const stepIn = Math.min(step, active - activeCursor, elapsed - t);
      if (stepIn <= 0) break;
      activeCursor += stepIn;
      t += stepIn;

      const p = activeCursor / active;
      const parabola = 4 * p * (1 - p);
      const edgeSkip = parabola < 0.22 && mulberry32(wave * 17 + tick + 21)() < 0.55;
      if (!edgeSkip) {
        const budget = curveCount(t) - count;
        if (budget > 0) {
          const want = Math.max(1, Math.round(parabola * (2 + intensity * 5)));
          const cap = parabola > 0.72 ? 8 : 4;
          count += Math.min(budget, want, cap);
        }
      }
      tick += 1;
    }

    if (t >= elapsed) break;
    t += Math.min(restTail, elapsed - t);
    wave += 1;
  }

  return Math.min(count, curveCount(elapsed), VIRTUAL_CAP);
}

/**
 * 10 minutes of uneven bursts that land on the virtual target.
 * The public number is this plus real mints, so the snapshot real total
 * makes the desk read 3,000 at the end of the window.
 */
function sprintVirtual(elapsedMs: number, from: number, to: number): number {
  if (elapsedMs <= 0 || to <= from) return from;
  if (elapsedMs >= SPRINT_WINDOW_MS) return to;
  const delta = to - from;
  let t = 0;
  let count = from;
  let i = 0;
  while (t < elapsedMs && count < to && i < 500) {
    const gap = randInt(i + 2_400, 2_800, 5_400);
    if (t + gap > elapsedMs) break;
    t += gap;
    const p = t / SPRINT_WINDOW_MS;
    const eased = p ** 0.82;
    const ideal = from + Math.round(delta * eased);
    const room = ideal - count;
    if (room <= 0) {
      i += 1;
      continue;
    }
    const parabola = 4 * p * (1 - p);
    const edge = parabola < 0.2 && mulberry32(i + 77)() < 0.45;
    const want = edge
      ? randInt(i + 90, 2, 6)
      : Math.max(6, Math.round(8 + parabola * 18));
    count += p > 0.92 ? room : Math.min(room, want);
    i += 1;
  }
  return Math.min(count, to);
}

/** After 3,000: ease-out parabola, fastest just after the sprint, then gentler into 4,500. */
function slowIdeal(elapsedMs: number, durationMs: number): number {
  const p = Math.min(1, Math.max(0, elapsedMs / durationMs));
  const eased = 1 - (1 - p) ** 2;
  return SPRINT_VIRTUAL_TARGET + Math.round((VIRTUAL_CAP - SPRINT_VIRTUAL_TARGET) * eased);
}

function slowVirtual(nowMs: number): number {
  const slowStart = SPRINT_START_MS + SPRINT_WINDOW_MS;
  const windowEnd = campaignWindowEndMs();
  if (nowMs >= windowEnd) return VIRTUAL_CAP;
  const duration = Math.max(1, windowEnd - slowStart);
  const elapsed = nowMs - slowStart;
  if (elapsed <= 0) return SPRINT_VIRTUAL_TARGET;

  let t = 0;
  let count = SPRINT_VIRTUAL_TARGET;
  let wave = 0;
  while (t < elapsed && count < VIRTUAL_CAP && wave < 2_000) {
    const rest = randInt(wave + 640, 70_000, 160_000);
    if (t + rest > elapsed) break;
    t += rest;
    const ideal = slowIdeal(t, duration);
    const room = ideal - count;
    if (room > 0) {
      const take = Math.max(2, Math.round(room * (0.7 + mulberry32(wave + 19)() * 0.3)));
      count += Math.min(room, take, 22);
    }
    wave += 1;
  }
  return Math.min(count, slowIdeal(elapsed, duration), VIRTUAL_CAP);
}

export function virtualMintCountAt(nowMs: number = Date.now()): number {
  if (nowMs < SPRINT_START_MS) return legacyVirtualMintCount(nowMs);
  const from = legacyVirtualMintCount(SPRINT_START_MS);
  const sprintElapsed = nowMs - SPRINT_START_MS;
  if (sprintElapsed <= SPRINT_WINDOW_MS) return sprintVirtual(sprintElapsed, from, SPRINT_VIRTUAL_TARGET);
  return slowVirtual(nowMs);
}

function postCapDisplayBonus(nowMs: number): number {
  nowMs = clockMs(nowMs);
  const capPhaseEnd = VIRTUAL_PROGRESS_START_MS + VIRTUAL_WINDOW_MS;
  if (nowMs <= capPhaseEnd) return 0;
  const postElapsed = Math.min(nowMs - capPhaseEnd, POST_CAP_WINDOW_MS);
  let t = 0;
  let bonus = 0;
  let event = 0;
  while (t < postElapsed && bonus < POST_CAP_BONUS_MAX) {
    const wait = randInt(event + 501, 600_000, 1_200_000);
    if (t + wait > postElapsed) break;
    t += wait;
    bonus = Math.min(POST_CAP_BONUS_MAX, bonus + randInt(event + 909, 8, 42));
    event += 1;
  }
  return bonus;
}

export function movingMintProgress(realMinted: number, nowMs: number = Date.now()): {
  displayMinted: number;
  virtualMinted: number;
  realMinted: number;
  virtualFrozen: boolean;
  paused: boolean;
} {
  const baseVirtual = virtualMintCountAt(nowMs);
  const virtualFrozen = baseVirtual >= VIRTUAL_CAP;

  const real = Math.max(0, Math.floor(realMinted));

  if (virtualFrozen) {
    // After the 18h window the clock stays at 4500. Real mints are not folded in.
    const displayMinted = VIRTUAL_CAP + postCapDisplayBonus(nowMs);
    return {
      displayMinted,
      virtualMinted: displayMinted,
      realMinted: real,
      virtualFrozen: true,
      paused: false,
    };
  }

  // Before the cap, every visitor adds the same virtual clock and the same
  // server-side mint total. A real mint moves the number for the whole site.
  const displayMinted = baseVirtual + real;
  return {
    displayMinted,
    virtualMinted: baseVirtual,
    realMinted: real,
    virtualFrozen: false,
    paused: false,
  };
}

/** Number the site shows. While paused, every caller gets the same snapshot. */
export function displayMintProgress(realMinted: number, nowMs: number = Date.now()): {
  displayMinted: number;
  virtualMinted: number;
  realMinted: number;
  virtualFrozen: boolean;
  paused: boolean;
} {
  if (MINT_PROGRESS_PAUSE) {
    return {
      displayMinted: MINT_PROGRESS_PAUSE.displayMinted,
      virtualMinted: MINT_PROGRESS_PAUSE.virtualMinted,
      realMinted: MINT_PROGRESS_PAUSE.realMinted,
      virtualFrozen: false,
      paused: true,
    };
  }
  return movingMintProgress(realMinted, nowMs);
}
