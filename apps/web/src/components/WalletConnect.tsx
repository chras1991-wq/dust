"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  ALL_ADAPTERS,
  type Account,
  type BitcoinWalletAdapter,
  type WalletId,
} from "@satdust/wallet";

const INSTALL_URL: Record<WalletId, string> = {
  unisat: "https://unisat.io",
  okx: "https://www.okx.com/web3",
  xverse: "https://www.xverse.app",
  leather: "https://leather.io",
  phantom: "https://phantom.com",
  bitget: "https://web3.bitget.com",
};

type Props = {
  onAccount?: (account: Account | null, adapter: BitcoinWalletAdapter | null) => void;
  /** Lets parent CTAs open the wallet modal (e.g. Connect & Mint). */
  registerOpen?: (open: () => void) => void;
  /** Hide standalone Connect button — parent provides the only CTA. */
  headlessUntilConnected?: boolean;
  /** Replaces the address in the connected pill. Mint desk passes the BTC balance. */
  balanceText?: string | null;
};

export function WalletConnect({ onAccount, registerOpen, headlessUntilConnected, balanceText }: Props) {
  const { ready: privyReady } = usePrivy();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [adapterId, setAdapterId] = useState<WalletId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    registerOpen?.(() => setOpen(true));
  }, [registerOpen]);
  const available = useMemo(() => {
    const list = [...ALL_ADAPTERS];
    if (!mounted) return list;
    return list.sort((a, b) => Number(b.isAvailable()) - Number(a.isAvailable()));
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
    <div className="relative" data-wallet-service={privyReady ? "ready" : "loading"}>
      {account ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="pill-tag">
            {balanceText || `${adapterId} · ${account.address.slice(0, 6)}…${account.address.slice(-4)}`}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            Switch
          </button>
          <button type="button" className="btn" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : headlessUntilConnected ? null : (
        <button type="button" className="btn btn-solid" onClick={() => setOpen(true)}>
          Connect Wallet
        </button>
      )}

      {error && <p className="mt-3 font-sans text-sm text-[var(--invalid)]">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full sm:mb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="kicker">Wallet</p>
                <h2 className="font-display mt-2 text-2xl sm:text-3xl">Connect Bitcoin wallet</h2>
                <p className="mt-2 text-sm text-[var(--ink-mute)]">
                  UniSat, OKX, Xverse, Leather, Phantom, or Bitget on Bitcoin mainnet. Each one can
                  pay the mint. Never paste a seed / private key / WIF.
                </p>
              </div>
              <button type="button" className="btn btn-ghost !w-auto shrink-0 px-3" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ul className="mt-6 space-y-2">
              {available.map((w) => {
                const installed = mounted ? w.isAvailable() : false;
                const id = w.id as WalletId;
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center justify-between border border-[var(--ink)] px-4 py-3 text-left hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                      onClick={() => {
                        if (!installed) {
                          window.open(INSTALL_URL[id], "_blank", "noopener,noreferrer");
                          return;
                        }
                        void connect(w);
                      }}
                    >
                      <span className="font-display text-lg">{w.name}</span>
                      <span className="font-condensed text-[0.7rem] uppercase tracking-[0.12em]">
                        {installed ? "Ready" : "Install"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {mounted && !available.some((w) => w.isAvailable()) && (
              <p className="mt-4 text-sm text-[var(--ink-mute)]">
                No Bitcoin wallet in this browser yet. Install one above, then refresh.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
