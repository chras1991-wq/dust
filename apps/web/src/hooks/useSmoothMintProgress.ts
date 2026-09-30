"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickProgressMotion } from "@/lib/mint-progress-motion";
import { displayMintProgress } from "@/lib/virtual-progress";

/** Live mint counter: irregular batches toward server/virtual target (not +1 tick per second). */
export function useSmoothMintProgress() {
  const [realMinted, setRealMinted] = useState(0);
  const [shown, setShown] = useState(1);
  const shownRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userBurstRef = useRef(0);

  const syncReal = useCallback(async () => {
    try {
      const res = await fetch("/api/mint/progress", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { realMinted?: number };
      if (typeof data.realMinted === "number") setRealMinted(data.realMinted);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/mint/progress", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { realMinted?: number };
        const real = typeof data.realMinted === "number" ? data.realMinted : 0;
        setRealMinted(real);
        const target = displayMintProgress(real, Date.now()).displayMinted;
        const start = Math.max(1, target - randInt(25, 95));
        shownRef.current = start;
        setShown(start);
      } catch {
        /* ignore */
      }
    })();
    const id = setInterval(() => void syncReal(), 45_000);
    return () => clearInterval(id);
  }, [syncReal]);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    const schedule = () => {
      const target = displayMintProgress(realMinted, Date.now()).displayMinted;
      const prev = shownRef.current;
      const gap = target - prev;

      if (gap <= 0) {
        if (target < prev) {
          shownRef.current = target;
          setShown(target);
        }
        timerRef.current = setTimeout(schedule, pickProgressMotion(0).delayMs);
        return;
      }

      let { delta, delayMs } = pickProgressMotion(gap);

      if (userBurstRef.current > 0) {
        const bump = Math.min(userBurstRef.current, gap);
        userBurstRef.current -= bump;
        delta = Math.max(delta, Math.min(bump, randInt(3, Math.min(120, bump))));
        delayMs = Math.min(delayMs, randInt(400, 1400));
      }

      if (delta > 0) {
        const next = Math.min(target, prev + delta);
        shownRef.current = next;
        setShown(next);
      }

      timerRef.current = setTimeout(schedule, delayMs);
    };

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [realMinted]);

  const bumpReal = useCallback((delta: number) => {
    const d = Math.max(0, Math.floor(delta));
    if (d > 0) userBurstRef.current += d;
    setRealMinted((r) => r + d);
  }, []);

  return { liveMinted: shown, bumpReal, refreshReal: syncReal };
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
