/**
 * Deterministic virtual mint progress — discrete jumps only (no smooth clock creep).
 * Re-anchored at 1000 from 2026-09-30 16:45 Beijing.
 */

export const VIRTUAL_PROGRESS_START_MS = Date.parse("2026-09-30T08:45:00.000Z");
export const VIRTUAL_FLOOR = 1000;
export const VIRTUAL_CAP = 4500;
/** 18h onboarding window after anchor. */
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
export function virtualMintCountAt(nowMs: number = Date.now()): number {
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

function postCapDisplayBonus(nowMs: number): number {
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

export function displayMintProgress(realMinted: number, nowMs: number = Date.now()): {
  displayMinted: number;
  virtualMinted: number;
  realMinted: number;
  virtualFrozen: boolean;
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
  };
}
