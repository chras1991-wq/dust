"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { displayMintProgress } from "@/lib/virtual-progress";

type ProgressPayload = {
  realMinted?: number;
  displayMinted?: number;
  serverTimeMs?: number;
  authorized?: number;
};

/**
 * Global mint counter. Display = virtual clock + real mints recorded on the
 * server. The clock is the server's time, so every visitor sees the same sum.
 */
export function useSmoothMintProgress() {
  const [shown, setShown] = useState<number | null>(() =>
    displayMintProgress(0, Date.now()).displayMinted
  );
  const [authorized, setAuthorized] = useState<number | null>(null);
  const [progressReady, setProgressReady] = useState(true);
  const realRef = useRef(0);
  const offsetRef = useRef(0);

  const publish = useCallback((real: number, now = Date.now() + offsetRef.current) => {
    const next = displayMintProgress(real, now).displayMinted;
    setShown((prev) => (prev == null ? next : Math.max(prev, next)));
    setProgressReady(true);
  }, []);

  const syncProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/mint/progress", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ProgressPayload;
      const real = typeof data.realMinted === "number" ? data.realMinted : 0;
      realRef.current = Math.max(realRef.current, real);
      if (typeof data.serverTimeMs === "number") {
        offsetRef.current = data.serverTimeMs - Date.now();
      }
      if (typeof data.authorized === "number") setAuthorized(data.authorized);
      const aligned = Date.now() + offsetRef.current;
      const local = displayMintProgress(realRef.current, aligned).displayMinted;
      const server =
        typeof data.displayMinted === "number"
          ? displayMintProgress(realRef.current, data.serverTimeMs ?? aligned).displayMinted
          : local;
      const next = Math.max(local, server);
      setShown((prev) => (prev == null ? next : Math.max(prev, next)));
      setProgressReady(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void syncProgress();
    const poll = setInterval(() => void syncProgress(), 5_000);
    const tick = setInterval(() => publish(realRef.current), 2_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [publish, syncProgress]);

  const bumpReal = useCallback(
    (delta: number) => {
      const d = Math.max(0, Math.floor(delta));
      if (d <= 0) return;
      realRef.current += d;
      publish(realRef.current);
    },
    [publish]
  );

  return {
    liveMinted: shown,
    authorized,
    progressReady,
    bumpReal,
    refreshReal: syncProgress,
  };
}
