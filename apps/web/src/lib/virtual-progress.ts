/**
 * Deterministic virtual mint progress for FOMO display.
 * Start: 2026-09-30 15:10 Beijing (UTC 07:10).
 * Caps at 4500; real mint count can push display higher afterward.
 */

export const VIRTUAL_PROGRESS_START_MS = Date.parse("2026-09-30T07:10:00.000Z");
export const VIRTUAL_CAP = 4500;
/** Onboarding window — ~70% of virtual growth lands in the tail. */
export const VIRTUAL_WINDOW_MS = 8 * 60 * 60 * 1000;

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

/** Pure virtual count from the campaign clock (no real mints). */
export function virtualMintCountAt(nowMs: number = Date.now()): number {
  if (nowMs < VIRTUAL_PROGRESS_START_MS) return 1;

  const elapsed = nowMs - VIRTUAL_PROGRESS_START_MS;
  const phase1Ms = 10 * 60 * 1000;

  if (elapsed <= phase1Ms) {
    return Math.max(1, Math.round(1 + (567 * elapsed) / phase1Ms));
  }

  let count = 568;
  let cursor = phase1Ms;

  const step2 = 2 * 60 * 1000;
  let bucket = 0;
  while (count < 1000 && cursor + step2 <= elapsed) {
    count = Math.min(1000, count + randInt(10_000 + bucket, 5, 30));
    cursor += step2;
    bucket += 1;
  }

  const burstEnd = Math.min(elapsed, VIRTUAL_WINDOW_MS * 0.32);
  let minute = 0;
  while (count < 2600 && cursor + 60_000 <= burstEnd) {
    const volatile = minute % 4 !== 1;
    const inc = volatile
      ? randInt(20_000 + minute, 18, 95)
      : randInt(30_000 + minute, 8, 22);
    count = Math.min(2600, count + inc);
    cursor += 60_000;
    minute += 1;
  }

  const tailStart = VIRTUAL_WINDOW_MS * 0.28;
  const tailCursor = Math.max(cursor, tailStart);
  if (elapsed <= tailCursor) {
    return Math.min(VIRTUAL_CAP, count);
  }

  const tailElapsed = Math.min(elapsed - tailCursor, VIRTUAL_WINDOW_MS - tailCursor);
  const tailDuration = VIRTUAL_WINDOW_MS - tailCursor;
  const t = tailDuration > 0 ? tailElapsed / tailDuration : 1;
  const eased = 1 - (1 - t) ** 2.4;
  const from = Math.max(count, 2600);
  const target = from + (VIRTUAL_CAP - from) * eased;
  return Math.min(VIRTUAL_CAP, Math.round(target));
}

export function displayMintProgress(realMinted: number, nowMs: number = Date.now()): {
  displayMinted: number;
  virtualMinted: number;
  realMinted: number;
  virtualFrozen: boolean;
} {
  const virtualMinted = virtualMintCountAt(nowMs);
  const virtualFrozen = virtualMinted >= VIRTUAL_CAP;
  const displayMinted = Math.max(virtualMinted, realMinted);
  return { displayMinted, virtualMinted, realMinted, virtualFrozen };
}
