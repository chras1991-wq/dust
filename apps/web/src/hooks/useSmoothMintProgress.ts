"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { displayMintProgress } from "@/lib/virtual-progress";

/** Live mint counter: ticks upward smoothly; server only syncs real mint totals. */
export function useSmoothMintProgress() {
  const [realMinted, setRealMinted] = useState(0);
  const [shown, setShown] = useState(1);
  const shownRef = useRef(1);

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
        const start = Math.max(1, target - 18 - Math.floor(Math.random() * 12));
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
    const tick = () => {
      const target = displayMintProgress(realMinted, Date.now()).displayMinted;
      const prev = shownRef.current;
      if (target <= prev) {
        if (target !== prev) {
          shownRef.current = target;
          setShown(target);
        }
        return;
      }
      const gap = target - prev;
      let step = 1;
      if (gap > 60) step = 2 + Math.floor(Math.random() * 2);
      else if (gap > 20) step = Math.random() > 0.35 ? 2 : 1;
      const next = Math.min(target, prev + step);
      shownRef.current = next;
      setShown(next);
    };

    tick();
    const id = window.setInterval(tick, 900 + Math.floor(Math.random() * 700));
    return () => window.clearInterval(id);
  }, [realMinted]);

  const bumpReal = useCallback((delta: number) => {
    setRealMinted((r) => r + delta);
  }, []);

  return { liveMinted: shown, bumpReal, refreshReal: syncReal };
}
