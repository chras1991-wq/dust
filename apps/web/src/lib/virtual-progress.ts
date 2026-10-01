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
/**
 * Fast public climb to 4,538. The schedule is the number on the desk, so a
 * real mint during these 20 minutes does not push it past the target.
 * After 4,500, real mints stay off the public counter.
 */
export const RUSH_START_MS = 1_790_819_301_373;
export const RUSH_WINDOW_MS = 20 * 60 * 1000;
export const RUSH_TARGET = 4538;
export const RUSH_REAL_SNAPSHOT = 594;
/** Slow rise after 4,538. Four hours sits inside the 2–5h payment window. */
export const RUSH_SLOW_WINDOW_MS = 4 * 60 * 60 * 1000;
/** 18h onboarding window after anchor. The slow parabola finishes here at 4,500. */
export const VIRTUAL_WINDOW_MS = 18 * 60 * 60 * 1000;
/** After 4500: display-only bonus in discrete steps. */
export const POST_CAP_WINDOW_MS = 5 * 60 * 60 * 1000;
export const POST_CAP_BONUS_MAX = 360;
export const RUSH_SLOW_CEILING = VIRTUAL_CAP + POST_CAP_BONUS_MAX;
/** Instant public jump, then a 5-minute hold. */
export const JUMP_AT_MS = 1_790_820_250_020;
export const JUMP_DISPLAY = 4317;
export const JUMP_PAUSE_MS = 5 * 60 * 1000;
/** Irregular bursts from the hold up to this mark. */
export const MARK_DISPLAY = 4618;
export const MARK_WINDOW_MS = 18 * 60 * 1000;
/** Genesis desk total. The slow irregular climb fills this in 5 hours. */
export const FILL_DISPLAY = 5460;
export const FILL_WINDOW_MS = 5 * 60 * 60 * 1000;
/** Fast uneven climb to 5,175. Ten minutes from this wall time. */
export const FAST_AT_MS = 1_790_821_599_918;
export const FAST_TARGET = 5175;
export const FAST_WINDOW_MS = 10 * 60 * 1000;
/** Slow uneven climb to 5,317. Twenty minutes from this wall time. */
export const DRIFT_AT_MS = 1_790_823_618_982;
export const DRIFT_TARGET = 5317;
export const DRIFT_WINDOW_MS = 20 * 60 * 1000;
/** Uneven climb to 5,396. One minute from this wall time. */
export const LIFT_AT_MS = 1_790_826_600_000;
export const LIFT_TARGET = 5396;
export const LIFT_WINDOW_MS = 60 * 1000;

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
function sprintVirtual(elapsedMs: number, from: number, to: number, windowMs: number): number {
  if (elapsedMs <= 0 || to <= from) return from;
  if (elapsedMs >= windowMs) return to;
  const delta = to - from;
  let t = 0;
  let count = from;
  let i = 0;
  while (t < elapsedMs && count < to && i < 800) {
    const gap = randInt(i + 2_400, 2_800, 5_400);
    if (t + gap > elapsedMs) break;
    t += gap;
    const p = t / windowMs;
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
  if (sprintElapsed <= SPRINT_WINDOW_MS) {
    return sprintVirtual(sprintElapsed, from, SPRINT_VIRTUAL_TARGET, SPRINT_WINDOW_MS);
  }
  return slowVirtual(nowMs);
}

function rushAnchor(): number {
  return Math.min(RUSH_TARGET, virtualMintCountAt(RUSH_START_MS) + RUSH_REAL_SNAPSHOT);
}

/** After 4,538: ease-out parabola in bursts across the payment window. */
function rushSlow(elapsedMs: number): number {
  if (elapsedMs <= 0) return RUSH_TARGET;
  if (elapsedMs >= RUSH_SLOW_WINDOW_MS) return RUSH_SLOW_CEILING;
  const span = RUSH_SLOW_CEILING - RUSH_TARGET;
  let t = 0;
  let count = RUSH_TARGET;
  let wave = 0;
  while (t < elapsedMs && count < RUSH_SLOW_CEILING && wave < 2_000) {
    const rest = randInt(wave + 1_100, 70_000, 150_000);
    if (t + rest > elapsedMs) break;
    t += rest;
    const p = Math.min(1, t / RUSH_SLOW_WINDOW_MS);
    const ideal = RUSH_TARGET + Math.round(span * (1 - (1 - p) ** 2));
    const room = ideal - count;
    if (room > 0) {
      const take = Math.max(2, Math.round(room * (0.7 + mulberry32(wave + 23)() * 0.3)));
      count += Math.min(room, take, 18);
    }
    wave += 1;
  }
  const p = Math.min(1, elapsedMs / RUSH_SLOW_WINDOW_MS);
  const ideal = RUSH_TARGET + Math.round(span * (1 - (1 - p) ** 2));
  return Math.min(count, ideal, RUSH_SLOW_CEILING);
}

function chunkAdds(need: number, count: number, seed: number, cap: number): number[] {
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const roll = mulberry32(seed + i * 17 + 3);
    const band = roll();
    const size = roll();
    if (band < 0.4) weights.push(3 + size * 4);
    else if (band < 0.72) weights.push(10 + size * 8);
    else weights.push(22 + size * 28);
  }
  const sumW = weights.reduce((total, w) => total + w, 0);
  const raw = weights.map((w) => (w / sumW) * need);
  const adds = raw.map((value) => Math.min(cap, Math.max(1, Math.floor(value))));
  let left = need - adds.reduce((total, n) => total + n, 0);
  const rank = raw
    .map((value, index) => ({
      index,
      key: value - Math.floor(value) + mulberry32(seed + index * 91)() * 0.02,
    }))
    .sort((a, b) => b.key - a.key);
  let guard = 0;
  while (left > 0 && guard < need * 4) {
    const slot = rank[guard % rank.length]!.index;
    if (adds[slot]! < cap) {
      adds[slot] = adds[slot]! + 1;
      left -= 1;
    }
    guard += 1;
  }
  while (left < 0) {
    let donor = 0;
    for (let i = 1; i < adds.length; i++) if (adds[i]! > adds[donor]!) donor = i;
    if (adds[donor]! <= 1) break;
    adds[donor] = adds[donor]! - 1;
    left += 1;
  }
  return adds;
}

function chunkTimes(durationMs: number, count: number, seed: number, lead = false): number[] {
  const gaps: number[] = [];
  for (let i = 0; i < count; i++) {
    const roll = mulberry32(seed + i * 53 + 11);
    const band = roll();
    const size = roll();
    if (lead) {
      if (band < 0.34) gaps.push(12 + size * 20);
      else if (band < 0.7) gaps.push(28 + size * 35);
      else gaps.push(50 + size * 40);
    } else if (band < 0.16) gaps.push(4 + size * 10);
    else if (band < 0.46) gaps.push(16 + size * 45);
    else if (band < 0.78) gaps.push(55 + size * 110);
    else gaps.push(140 + size * 220);
  }
  const head = lead ? 12_000 + Math.round(mulberry32(seed + 7)() * 18_000) : 0;
  const body = gaps.slice(lead ? 1 : 0);
  const bodySum = body.reduce((total, gap) => total + gap, 0) || 1;
  const bodyDuration = Math.max(1_000, durationMs - head);
  let cursor = head;
  const times: number[] = lead ? [head] : [];
  for (let i = 0; i < body.length; i++) {
    cursor += (body[i]! / bodySum) * bodyDuration;
    times.push(Math.min(durationMs, Math.round(cursor)));
  }
  times[times.length - 1] = durationMs;
  if (lead) {
    const maxGap = 150_000;
    for (let pass = 0; pass < 8; pass++) {
      let prev = 0;
      let worst = -1;
      let worstGap = 0;
      for (let i = 0; i < times.length - 1; i++) {
        const gap = times[i]! - prev;
        if (gap > worstGap) {
          worstGap = gap;
          worst = i;
        }
        prev = times[i]!;
      }
      if (worst < 0 || worstGap <= maxGap) break;
      times[worst] = (worst === 0 ? 0 : times[worst - 1]!) + maxGap;
    }
    for (let i = 1; i < times.length; i++) {
      if (times[i]! <= times[i - 1]!) times[i] = times[i - 1]! + 8_000;
    }
    times[times.length - 1] = durationMs;
  }
  return times;
}

/** Uneven jumps. Same timestamp always yields the same total. */
export function irregularMintCount(
  elapsedMs: number,
  durationMs: number,
  from: number,
  to: number,
  seed: number,
  cap = 52,
  lead = false
): number {
  if (elapsedMs <= 0 || to <= from) return from;
  if (elapsedMs >= durationMs) return to;
  const need = to - from;
  const steps = Math.max(12, Math.min(80, Math.round(need / 14)));
  const adds = chunkAdds(need, steps, seed, cap);
  const times = chunkTimes(durationMs, steps, seed + 404, lead);
  let count = from;
  for (let i = 0; i < steps; i++) {
    if (times[i]! > elapsedMs) break;
    count += adds[i]!;
  }
  return Math.min(count, to);
}

/** Desk number before the ten-minute climb to 5,175. */
function displayBeforeFastClimb(nowMs: number): number {
  const elapsed = nowMs - JUMP_AT_MS;
  if (elapsed < JUMP_PAUSE_MS) return JUMP_DISPLAY;
  const afterPause = elapsed - JUMP_PAUSE_MS;
  if (afterPause <= MARK_WINDOW_MS) {
    return irregularMintCount(afterPause, MARK_WINDOW_MS, JUMP_DISPLAY, MARK_DISPLAY, 861);
  }
  const afterMark = afterPause - MARK_WINDOW_MS;
  return irregularMintCount(afterMark, FILL_WINDOW_MS, MARK_DISPLAY, FILL_DISPLAY, 2_441);
}

/** Desk number before the twenty-minute drift to 5,317. */
function displayBeforeDrift(nowMs: number): number {
  if (nowMs < FAST_AT_MS) return displayBeforeFastClimb(nowMs);
  const from = Math.min(FAST_TARGET, displayBeforeFastClimb(FAST_AT_MS));
  const elapsed = nowMs - FAST_AT_MS;
  if (elapsed <= FAST_WINDOW_MS) {
    return irregularMintCount(elapsed, FAST_WINDOW_MS, from, FAST_TARGET, 5_175);
  }
  const fillEnd = JUMP_AT_MS + JUMP_PAUSE_MS + MARK_WINDOW_MS + FILL_WINDOW_MS;
  const slowStart = FAST_AT_MS + FAST_WINDOW_MS;
  const slowMs = Math.max(60_000, fillEnd - slowStart);
  return irregularMintCount(elapsed - FAST_WINDOW_MS, slowMs, FAST_TARGET, FILL_DISPLAY, 51_751);
}

/**
 * Public desk number. From DRIFT_AT_MS it reaches 5,317 in twenty minutes,
 * then climbs to 5,396, then keeps filling 5,460. Real mints do not move it.
 */
export function jumpedMintDisplay(nowMs: number): number {
  if (nowMs < DRIFT_AT_MS) return displayBeforeDrift(nowMs);
  const from = Math.min(DRIFT_TARGET, displayBeforeDrift(DRIFT_AT_MS));
  const elapsed = nowMs - DRIFT_AT_MS;
  if (elapsed <= DRIFT_WINDOW_MS) {
    return irregularMintCount(elapsed, DRIFT_WINDOW_MS, from, DRIFT_TARGET, 5_317, 16, true);
  }

  if (nowMs < LIFT_AT_MS) return DRIFT_TARGET;

  const liftElapsed = nowMs - LIFT_AT_MS;
  if (liftElapsed <= LIFT_WINDOW_MS) {
    return irregularMintCount(
      liftElapsed,
      LIFT_WINDOW_MS,
      DRIFT_TARGET,
      LIFT_TARGET,
      5_396,
      16,
      true
    );
  }

  const fillEnd = JUMP_AT_MS + JUMP_PAUSE_MS + MARK_WINDOW_MS + FILL_WINDOW_MS;
  const slowStart = LIFT_AT_MS + LIFT_WINDOW_MS;
  const slowMs = Math.max(60_000, fillEnd - slowStart);
  return irregularMintCount(liftElapsed - LIFT_WINDOW_MS, slowMs, LIFT_TARGET, FILL_DISPLAY, 53_961);
}

/** Public number from the 20-minute rush onward. Real mints are not added. */
export function rushDisplay(nowMs: number): number {
  const from = rushAnchor();
  const elapsed = nowMs - RUSH_START_MS;
  if (elapsed <= RUSH_WINDOW_MS) {
    return sprintVirtual(elapsed, from, RUSH_TARGET, RUSH_WINDOW_MS);
  }
  return rushSlow(elapsed - RUSH_WINDOW_MS);
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
  const real = Math.max(0, Math.floor(realMinted));

  if (nowMs >= JUMP_AT_MS) {
    const displayMinted = jumpedMintDisplay(nowMs);
    return {
      displayMinted,
      virtualMinted: displayMinted,
      realMinted: real,
      virtualFrozen: displayMinted >= VIRTUAL_CAP,
      paused: nowMs < JUMP_AT_MS + JUMP_PAUSE_MS,
    };
  }

  if (nowMs >= RUSH_START_MS) {
    const displayMinted = rushDisplay(nowMs);
    return {
      displayMinted,
      virtualMinted: displayMinted,
      realMinted: real,
      virtualFrozen: displayMinted >= VIRTUAL_CAP,
      paused: false,
    };
  }

  const baseVirtual = virtualMintCountAt(nowMs);
  const virtualFrozen = baseVirtual >= VIRTUAL_CAP;

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
