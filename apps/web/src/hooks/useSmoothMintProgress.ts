"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  nextRhythm,
  pickProgressMotion,
  type MotionRhythm,
} from "@/lib/mint-progress-motion";
import { VIRTUAL_FLOOR, displayMintProgress } from "@/lib/virtual-progress";

/** Mint counter: idle ↔ short active runs toward the global ceiling (变奏). */
export function useSmoothMintProgress() {
  const [realMinted, setRealMinted] = useState(0);
  const [shown, setShown] = useState(VIRTUAL_FLOOR);
  const shownRef = useRef(VIRTUAL_FLOOR);
  const ceilingRef = useRef(VIRTUAL_FLOOR);
  const rhythmRef = useRef<MotionRhythm>({ mode: "idle", activeTicksLeft: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userBurstRef = useRef(0);
  const tickSeedRef = useRef(0);

  const readCeiling = useCallback((real: number) => {
    const next = displayMintProgress(real, Date.now()).displayMinted;
    ceilingRef.current = next;
    return next;
  }, []);

  const syncReal = useCallback(async () => {
    try {
      const res = await fetch("/api/mint/progress", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { realMinted?: number; displayMinted?: number };
      if (typeof data.realMinted === "number") setRealMinted(data.realMinted);
      if (typeof data.displayMinted === "number") {
        ceilingRef.current = data.displayMinted;
      } else if (typeof data.realMinted === "number") {
        readCeiling(data.realMinted);
      }
    } catch {
      /* ignore */
    }
  }, [readCeiling]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/mint/progress", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { realMinted?: number; displayMinted?: number };
        const real = typeof data.realMinted === "number" ? data.realMinted : 0;
        setRealMinted(real);
        const ceiling =
          typeof data.displayMinted === "number"
            ? data.displayMinted
            : readCeiling(real);
        const start = Math.min(ceiling, VIRTUAL_FLOOR);
        shownRef.current = start;
        ceilingRef.current = ceiling;
        setShown(start);
      } catch {
        shownRef.current = VIRTUAL_FLOOR;
        setShown(VIRTUAL_FLOOR);
      }
    })();
    const id = setInterval(() => void syncReal(), 30_000);
    return () => clearInterval(id);
  }, [readCeiling, syncReal]);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    const schedule = () => {
      readCeiling(realMinted);
      const target = ceilingRef.current;
      const prev = shownRef.current;
      const gap = target - prev;

      rhythmRef.current = nextRhythm(rhythmRef.current, gap);

      if (gap <= 0) {
        if (target < prev) {
          shownRef.current = target;
          setShown(target);
        }
        timerRef.current = setTimeout(schedule, pickProgressMotion(0, rhythmRef.current).delayMs);
        return;
      }

      let { delta, delayMs } = pickProgressMotion(gap, rhythmRef.current);

      if (userBurstRef.current > 0) {
        const bump = Math.min(userBurstRef.current, gap);
        userBurstRef.current -= bump;
        rhythmRef.current = { mode: "active", activeTicksLeft: 3 };
        delta = Math.max(delta, Math.min(bump, randInt(5, Math.min(120, bump))));
        delayMs = Math.min(delayMs, randInt(800, 2200));
      }

      if (delta > 0) {
        const next = Math.min(target, prev + delta);
        shownRef.current = next;
        setShown(next);
      }

      tickSeedRef.current += 1;
      timerRef.current = setTimeout(schedule, delayMs);
    };

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [realMinted, readCeiling]);

  const bumpReal = useCallback((delta: number) => {
    const d = Math.max(0, Math.floor(delta));
    if (d > 0) userBurstRef.current += d;
    setRealMinted((r) => r + d);
    ceilingRef.current = Math.max(ceilingRef.current, shownRef.current + d);
  }, []);

  return { liveMinted: shown, bumpReal, refreshReal: syncReal };
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
