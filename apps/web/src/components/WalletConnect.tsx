"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_ADAPTERS,
  type Account,
  type BitcoinWalletAdapter,
  type WalletId,
} from "@satdust/wallet";

type Props = {
  onAccount?: (account: Account | null, adapter: BitcoinWalletAdapter | null) => void;
};

const PILLS = ["pill-pink", "pill-cyan", "pill-lime", "pill-chrome"];

export function WalletConnect({ onAccount }: Props) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [adapterId, setAdapterId] = useState<WalletId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const available = useMemo(() => ALL_ADAPTERS, []);

  async function connect(adapter: BitcoinWalletAdapter) {
    setError(null);
    try {
      if (!adapter.isAvailable()) {
        setError(`${adapter.name} is not installed in this browser.`);
        return;
      }
      const acc = await adapter.connect();
      if (acc.network !== "mainnet") {
        setError("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
        setAccount(null);
        setAdapterId(null);
        onAccount?.(null, null);
        return;
      }
      setAccount(acc);
      setAdapterId(adapter.id as WalletId);
      onAccount?.(acc, adapter);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed");
    }
  }

  function disconnect() {
    setAccount(null);
    setAdapterId(null);
    onAccount?.(null, null);
  }

  return (
    <div className="relative">
      {account ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="pill pill-lime">
            {adapterId} · {account.address.slice(0, 6)}…{account.address.slice(-4)}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            Switch
          </button>
          <button type="button" className="btn" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-solid" onClick={() => setOpen(true)}>
          Connect Wallet
        </button>
      )}

      {error && <p className="mt-3 font-pixel text-[0.55rem] text-[var(--invalid)]">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,6,20,0.9)] p-4 backdrop-blur-sm">
          <div className="panel-y2k w-full max-w-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="pill pill-cyan">wallet rack</span>
                <h2 className="chrome-text mt-3 text-2xl">Pick one</h2>
                <p className="mt-2 text-sm text-[var(--ink-dim)]">
                  Sign PSBT only. Never seed / private key / WIF.
                </p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ul className="mt-6 space-y-3">
              {available.map((w, i) => {
                const ready = mounted ? w.isAvailable() : false;
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl border-2 border-white/40 bg-gradient-to-r from-white/20 to-white/5 px-4 py-3 text-left hover:from-[rgba(255,78,203,0.25)] hover:to-[rgba(65,243,255,0.2)]"
                      onClick={() => connect(w)}
                    >
                      <span className={`pill ${PILLS[i % PILLS.length]}`}>{w.name}</span>
                      <span className="font-pixel text-[0.5rem] uppercase text-[var(--ink-dim)]">
                        {ready ? "ready" : "missing"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
