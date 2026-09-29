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
          <span className="pill-tag">
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

      {error && <p className="mt-3 font-sans text-sm text-[var(--invalid)]">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="kicker">Wallet</p>
                <h2 className="font-display mt-2 text-2xl sm:text-3xl">Select adapter</h2>
                <p className="mt-2 text-sm text-[var(--ink-mute)]">
                  Sign PSBT only. Never seed / private key / WIF.
                </p>
              </div>
              <button type="button" className="btn btn-ghost !w-auto shrink-0 px-3" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ul className="mt-6 space-y-2">
              {available.map((w) => {
                const ready = mounted ? w.isAvailable() : false;
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center justify-between border border-[var(--ink)] px-4 py-3 text-left hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                      onClick={() => connect(w)}
                    >
                      <span className="font-display text-lg">{w.name}</span>
                      <span className="font-condensed text-[0.7rem] uppercase tracking-[0.12em]">
                        {ready ? "Ready" : "Missing"}
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
