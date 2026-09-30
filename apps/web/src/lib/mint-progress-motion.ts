/** Irregular mint counter steps — pauses, drips, batches, occasional whales. */

export type ProgressMotionPick = {
  delta: number;
  delayMs: number;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Next UI tick toward `gap` remaining mints. Often pauses; sometimes jumps like 10/100 mint txs.
 */
export function pickProgressMotion(gap: number): ProgressMotionPick {
  if (gap <= 0) {
    return { delta: 0, delayMs: randInt(2200, 6500) };
  }

  const r = Math.random();

  // Rest — counter sits still (common).
  if (r < 0.28) {
    return { delta: 0, delayMs: randInt(2800, 9000) };
  }

  // Whale / big batch (someone mints 50–120).
  if (gap >= 35 && r > 0.93) {
    const chunk = randInt(48, Math.min(140, gap));
    return { delta: chunk, delayMs: randInt(1600, 4200) };
  }

  // Medium batch (5–30).
  if (r < 0.58) {
    const hi = gap > 120 ? 32 : gap > 40 ? 24 : 14;
    const chunk = randInt(4, Math.min(hi, gap));
    return { delta: chunk, delayMs: randInt(700, 2400) };
  }

  // Slow drip (1–3) for a few beats.
  if (r < 0.82) {
    const chunk = randInt(1, Math.min(3, gap));
    return { delta: chunk, delayMs: randInt(1400, 3800) };
  }

  // Catch-up sprint when far behind the clock target.
  if (gap > 55) {
    const chunk = randInt(18, Math.min(65, gap));
    return { delta: chunk, delayMs: randInt(900, 2100) };
  }

  const chunk = randInt(6, Math.min(22, gap));
  return { delta: chunk, delayMs: randInt(1100, 3200) };
}
