/** Irregular mint counter — idle stretches + short active runs (变奏). */

export type ProgressMotionPick = {
  delta: number;
  delayMs: number;
};

export type MotionRhythm = {
  mode: "idle" | "active";
  activeTicksLeft: number;
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

/** Human-ish mint batch sizes (people mint round numbers). */
export function humanMintChunk(gap: number, seed: number): number {
  const nice = [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 500];
  const r = (seed * 1103515245 + 12345) >>> 0;
  const pick = nice[r % nice.length]!;
  if (pick <= gap) return pick;
  for (let i = nice.length - 1; i >= 0; i--) {
    if (nice[i]! <= gap) return nice[i]!;
  }
  return gap;
}

export function nextRhythm(prev: MotionRhythm, gap: number): MotionRhythm {
  if (gap <= 0) {
    return { mode: "idle", activeTicksLeft: 0 };
  }
  if (prev.mode === "active" && prev.activeTicksLeft > 0) {
    return { mode: "active", activeTicksLeft: prev.activeTicksLeft - 1 };
  }
  if (prev.mode === "idle" && Math.random() < 0.38) {
    return { mode: "active", activeTicksLeft: randInt(2, 5) };
  }
  return { mode: "idle", activeTicksLeft: 0 };
}

export function pickProgressMotion(gap: number, rhythm: MotionRhythm): ProgressMotionPick {
  if (gap <= 0) {
    return { delta: 0, delayMs: randInt(5000, 14_000) };
  }

  if (rhythm.mode === "idle") {
    if (Math.random() < 0.55) {
      return { delta: 0, delayMs: randInt(6000, 18_000) };
    }
    const chunk = humanMintChunk(gap, Date.now() % 9973);
    return { delta: Math.min(gap, chunk), delayMs: randInt(3500, 10_000) };
  }

  const r = Math.random();
  if (r < 0.2) {
    return { delta: 0, delayMs: randInt(2500, 6000) };
  }
  if (r > 0.9 && gap >= 30) {
    return {
      delta: clampChunk(gap, 40, 120),
      delayMs: randInt(1800, 4500),
    };
  }
  const chunk = humanMintChunk(gap, Date.now() + rhythm.activeTicksLeft * 17);
  return {
    delta: Math.min(gap, chunk),
    delayMs: randInt(1200, 3800),
  };
}
