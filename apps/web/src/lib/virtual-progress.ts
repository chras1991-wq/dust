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

function eventWaitMs(eventIndex: number): number {
  const r = mulberry32(eventIndex + 11_003)();
  if (r < 0.3) return randInt(eventIndex + 91, 3 * 60_000, 8 * 60_000);
  if (r < 0.62) return randInt(eventIndex + 44, 70_000, 180_000);
  return randInt(eventIndex + 77, 40_000, 110_000);
}

/** Release only a slice of the 18h budget — pauses, small bags, rare larger bags. */
function eventJump(eventIndex: number, budget: number): number {
  if (budget <= 0) return 0;
  const r = mulberry32(eventIndex + 88_001)();
  if (r < 0.24) return 0;
  const cap = Math.min(budget, r > 0.93 ? 48 : r > 0.72 ? 22 : 12);
  const nice = [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40].filter((n) => n <= cap);
  if (nice.length === 0) return Math.min(budget, cap);
  return nice[randInt(eventIndex + 3, 0, nice.length - 1)]!;
}

/**
 * Global step counter. Same timestamp → same number on every device.
 * Budget is the 18h curve, so a few minutes cannot reach the thousands.
 */
export function virtualMintCountAt(nowMs: number = Date.now()): number {
  if (nowMs < VIRTUAL_PROGRESS_START_MS) return VIRTUAL_FLOOR;

  const elapsed = nowMs - VIRTUAL_PROGRESS_START_MS;
  if (elapsed >= VIRTUAL_WINDOW_MS) return VIRTUAL_CAP;

  let t = 0;
  let count = VIRTUAL_FLOOR;
  let event = 0;

  while (t < elapsed && count < VIRTUAL_CAP) {
    const wait = eventWaitMs(event);
    if (t + wait > elapsed) break;
    t += wait;
    const budget = curveCount(t) - count;
    count += eventJump(event, budget);
    event += 1;
    if (event > 20_000) break;
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

  if (virtualFrozen) {
    const displayMinted = VIRTUAL_CAP + postCapDisplayBonus(nowMs);
    return {
      displayMinted,
      virtualMinted: displayMinted,
      realMinted,
      virtualFrozen: true,
    };
  }

  const displayMinted = Math.max(baseVirtual, realMinted);
  return {
    displayMinted,
    virtualMinted: baseVirtual,
    realMinted,
    virtualFrozen: false,
  };
}
