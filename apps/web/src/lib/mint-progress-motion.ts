/** Irregular mint counter steps — mostly idle; occasional batch jumps. */

export type ProgressMotionPick = {
  delta: number;
  delayMs: number;
};

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function clampChunk(gap: number, min: number, max: number): number {
  if (gap <= 0) return 0;
  const lo = Math.min(min, gap);
  const hi = Math.min(max, gap);
  return randInt(lo, hi);
}

/**
 * UI should sit still most of the time; when the server ceiling moves, jump in batches.
 */
export function pickProgressMotion(gap: number): ProgressMotionPick {
  if (gap <= 0) {
    return { delta: 0, delayMs: randInt(12_000, 28_000) };
  }

  const r = Math.random();

  if (r < 0.42) {
    return { delta: 0, delayMs: randInt(10_000, 35_000) };
  }

  if (gap >= 40 && r > 0.94) {
    return {
      delta: clampChunk(gap, 55, 140),
      delayMs: randInt(2500, 6000),
    };
  }

  if (r < 0.7) {
    return {
      delta: clampChunk(gap, 6, gap > 80 ? 38 : 24),
      delayMs: randInt(1800, 5500),
    };
  }

  if (r < 0.88) {
    return {
      delta: clampChunk(gap, 1, 4),
      delayMs: randInt(4000, 11_000),
    };
  }

  return {
    delta: clampChunk(gap, 22, Math.min(75, gap)),
    delayMs: randInt(2200, 7000),
  };
}
