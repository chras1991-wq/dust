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

const COLORS = ["sticker-orange", "sticker-hot", "sticker-cyan", "sticker-lime"];

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
          <span className="sticker sticker-lime" style={{ ["--rot" as string]: "-2deg" }}>
            {adapterId?.toUpperCase()} · {account.address.slice(0, 6)}…{account.address.slice(-4)}
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

      {error && <p className="mt-3 font-stamp text-[0.75rem] text-[var(--invalid)]">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,3,8,0.88)] p-4">
          <div className="panel-chaos w-full max-w-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="sticker sticker-cyan">WALLET RACK</span>
                <h2 className="font-display mt-3 text-3xl font-extrabold uppercase text-[var(--c-yellow)]">
                  Pick one
                </h2>
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
                      className="flex w-full items-center justify-between border-[3px] border-[var(--c-black)] bg-[var(--c-cream)] px-4 py-3 text-left text-[var(--c-black)] shadow-[5px_5px_0_var(--c-magenta)] hover:shadow-[7px_7px_0_var(--c-cyan)]"
                      onClick={() => connect(w)}
                    >
                      <span className={`sticker ${COLORS[i % COLORS.length]}`} style={{ ["--rot" as string]: `${(i % 3) - 1}deg` }}>
                        {w.name}
                      </span>
                      <span className="font-stamp text-[0.65rem] uppercase">
                        {ready ? "READY" : "MISSING"}
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
