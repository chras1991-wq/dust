"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProgressPayload = {
  realMinted?: number;
  displayMinted?: number;
  serverTimeMs?: number;
  authorized?: number;
  paused?: boolean;
  genesisClosed?: boolean;
};

/**
 * Public mint counter. The server snapshot is the only number shown.
 * A refresh cannot invent a local total, and a later poll cannot replace it
 * with a different instance's memory.
 */
export function useSmoothMintProgress() {
  const [shown, setShown] = useState<number | null>(null);
  const [authorized, setAuthorized] = useState<number | null>(null);
  const [genesisClosed, setGenesisClosed] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const reqRef = useRef(0);

  const syncProgress = useCallback(async () => {
    const reqId = ++reqRef.current;
    try {
      const res = await fetch("/api/mint/progress", { cache: "no-store" });
      if (!res.ok || reqId !== reqRef.current) return;
      const data = (await res.json()) as ProgressPayload;
      if (reqId !== reqRef.current) return;
      if (typeof data.displayMinted !== "number") return;
      if (typeof data.authorized === "number") setAuthorized(data.authorized);
      if (typeof data.genesisClosed === "boolean") setGenesisClosed(data.genesisClosed);
      setShown(data.displayMinted);
      setProgressReady(true);
    } catch {
      /* keep the last server number */
    }
  }, []);

  useEffect(() => {
    void syncProgress();
    const poll = setInterval(() => void syncProgress(), 2_000);
    return () => clearInterval(poll);
  }, [syncProgress]);

  const bumpReal = useCallback(
    (delta: number) => {
      if (!Number.isFinite(delta)) return;
      void syncProgress();
    },
    [syncProgress]
  );

  return {
    liveMinted: shown,
    authorized,
    genesisClosed,
    progressReady,
    bumpReal,
    refreshReal: syncProgress,
  };
}
