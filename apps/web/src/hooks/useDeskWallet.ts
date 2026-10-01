"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Account } from "@satdust/wallet";

export function useDeskWallet() {
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [btcSats, setBtcSats] = useState<number | null>(null);
  const openRef = useRef<(() => void) | null>(null);
  const reqRef = useRef(0);

  const refresh = useCallback(async (address: string) => {
    const reqId = ++reqRef.current;
    try {
      const res = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`, {
        cache: "no-store",
      });
      if (!res.ok || reqId !== reqRef.current) return;
      const data = (await res.json()) as { balance?: number; btcSats?: number | null };
      if (reqId !== reqRef.current) return;
      if (typeof data.balance === "number") setBalance(data.balance);
      setBtcSats(typeof data.btcSats === "number" ? data.btcSats : null);
    } catch {
      /* keep the last figure */
    }
  }, []);

  useEffect(() => {
    if (!account) {
      reqRef.current += 1;
      setBalance(null);
      setBtcSats(null);
      return;
    }
    void refresh(account.address);
  }, [account, refresh]);

  return {
    account,
    setAccount,
    balance,
    btcSats,
    refresh,
    openWallet: () => openRef.current?.(),
    registerOpen: useCallback((open: () => void) => {
      openRef.current = open;
    }, []),
  };
}
