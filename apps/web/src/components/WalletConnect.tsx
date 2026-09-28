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

  const available = useMemo(() => {
    if (!mounted) return ALL_ADAPTERS;
    return ALL_ADAPTERS;
  }, [mounted]);

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
          <span className="font-mono text-[0.7rem] text-[var(--ink-dim)]">
            {adapterId?.toUpperCase()} · {account.address.slice(0, 8)}…{account.address.slice(-6)}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            Switch
          </button>
          <button type="button" className="btn btn-ghost" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-solid" onClick={() => setOpen(true)}>
          Connect Wallet
        </button>
      )}

      {error && (
        <p className="mt-3 font-mono text-[0.75rem] text-[var(--invalid)]">{error}</p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-[var(--rule)] bg-[var(--bg-1)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-num">§ Wallet</p>
                <h2 className="font-display mt-1 text-2xl text-[var(--ink)]">Select adapter</h2>
                <p className="mt-2 text-sm text-[var(--ink-dim)]">
                  Business logic is wallet-agnostic. Only PSBT signing is requested — never
                  seed phrases or private keys.
                </p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
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
                      className="flex w-full items-center justify-between border border-[var(--rule)] px-4 py-3 text-left hover:border-[var(--accent)]"
                      onClick={() => connect(w)}
                    >
                      <span className="font-mono text-sm text-[var(--ink)]">{w.name}</span>
                      <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--ink-faint)]">
                        {ready ? "Detected" : "Not found"}
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
