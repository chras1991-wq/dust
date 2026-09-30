"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { displayMintProgress } from "@/lib/virtual-progress";

type ProgressPayload = {
  realMinted?: number;
  displayMinted?: number;
  serverTimeMs?: number;
};

/**
 * One global mint counter. The page shows the server clock value immediately.
 * Refresh does not replay from 1000.
 */
export function useSmoothMintProgress() {
  const [shown, setShown] = useState<number | null>(null);
  const [progressReady, setProgressReady] = useState(false);
  const realRef = useRef(0);

  const applyServerProgress = useCallback((data: ProgressPayload) => {
    const real = typeof data.realMinted === "number" ? data.realMinted : 0;
    const display =
      typeof data.displayMinted === "number"
        ? data.displayMinted
        : displayMintProgress(real, data.serverTimeMs ?? Date.now()).displayMinted;
    realRef.current = real;
    setShown(display);
    setProgressReady(true);
  }, []);

  const syncProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/mint/progress", { cache: "no-store" });
      if (!res.ok) return;
      applyServerProgress((await res.json()) as ProgressPayload);
    } catch {
      /* ignore */
    }
  }, [applyServerProgress]);

  useEffect(() => {
    void syncProgress();
    const id = setInterval(() => void syncProgress(), 20_000);
    return () => clearInterval(id);
  }, [syncProgress]);

  const bumpReal = useCallback((delta: number) => {
    const d = Math.max(0, Math.floor(delta));
    if (d <= 0) return;
    realRef.current += d;
    const display = displayMintProgress(realRef.current, Date.now()).displayMinted;
    setShown((prev) => (prev == null ? display : Math.max(prev, display)));
  }, []);

  return {
    liveMinted: shown,
    progressReady,
    bumpReal,
    refreshReal: syncProgress,
  };
}
