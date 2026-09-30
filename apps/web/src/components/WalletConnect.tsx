"use client";

import { useCreateWallet, useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useLogin, useModalStatus, usePrivy, type User } from "@privy-io/react-auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_ADAPTERS,
  type Account,
  type BitcoinWalletAdapter,
} from "@satdust/wallet";
import { findPrivyBitcoin, privyBitcoinAdapter, type PrivyBtcAccount } from "@/lib/privy-btc";

type Props = {
  onAccount?: (account: Account | null, adapter: BitcoinWalletAdapter | null) => void;
  /** Lets parent CTAs open the wallet modal (e.g. Connect & Mint). */
  registerOpen?: (open: () => void) => void;
};

export function WalletConnect({ onAccount, registerOpen }: Props) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { isOpen: privyOpen } = useModalStatus();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [adapterId, setAdapterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const signRef = useRef(signRawHash);
  signRef.current = signRawHash;
  const onAccountRef = useRef(onAccount);
  onAccountRef.current = onAccount;
  const ensuring = useRef(false);
  const privyWasOpen = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (privyOpen) privyWasOpen.current = true;
    if (privyWasOpen.current && !privyOpen && !ensuring.current) setBusy(false);
  }, [privyOpen]);
  useEffect(() => {
    registerOpen?.(() => setOpen(true));
  }, [registerOpen]);

  const browsers = useMemo(() => {
    const list = [...ALL_ADAPTERS];
    list.sort((a, b) => {
      const ar = mounted && a.isAvailable() ? 0 : 1;
      const br = mounted && b.isAvailable() ? 0 : 1;
      if (ar !== br) return ar - br;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [mounted]);

  function applyPrivy(found: PrivyBtcAccount) {
    const adapter = privyBitcoinAdapter({
      address: found.address,
      publicKey: found.publicKey,
      signHash: (hash) => signRef.current({ address: found.address, chainType: "bitcoin-segwit", hash }).then((res) => res.signature),
    });
    const next: Account = {
      address: found.address,
      publicKey: found.publicKey || undefined,
      network: "mainnet",
    };
    setAccount(next);
    setWalletName("Privy");
    setAdapterId("privy");
    onAccountRef.current?.(next, adapter);
    setOpen(false);
  }

  async function ensureBitcoin(source?: User | null) {
    if (ensuring.current) return;
    ensuring.current = true;
    setBusy(true);
    setError(null);
    try {
      let found = findPrivyBitcoin(source ?? user);
      if (!found) {
        const created = await createWallet({ chainType: "bitcoin-segwit" });
        found =
          findPrivyBitcoin(created.user) ??
          ({
            address: created.wallet.address,
            publicKey: "",
          } satisfies PrivyBtcAccount);
      }
      if (!found.address.startsWith("bc1")) {
        throw new Error("Wrong Network. Switch your wallet to Bitcoin Mainnet.");
      }
      applyPrivy(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed");
    } finally {
      ensuring.current = false;
      setBusy(false);
    }
  }

  const { login } = useLogin({
    onComplete: ({ user: loggedIn }) => {
      void ensureBitcoin(loggedIn);
    },
    onError: (code) => {
      setError(typeof code === "string" ? code : "Wallet connection failed");
      setBusy(false);
    },
  });

  useEffect(() => {
    if (!ready || !authenticated || adapterId) return;
    const found = findPrivyBitcoin(user);
    if (found) applyPrivy(found);
  }, [ready, authenticated, user, adapterId]);

  function connectPrivy() {
    setError(null);
    if (!ready) {
      setError("Wallet connection is still loading.");
      return;
    }
    setOpen(false);
    if (!authenticated) {
      setBusy(true);
      login();
      return;
    }
    void ensureBitcoin(user);
  }

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
        setWalletName(null);
        setAdapterId(null);
        onAccount?.(null, null);
        return;
      }
      setAccount(acc);
      setWalletName(adapter.name);
      setAdapterId(adapter.id);
      onAccount?.(acc, adapter);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed");
    }
  }

  async function disconnect() {
    setAccount(null);
    setWalletName(null);
    setAdapterId(null);
    onAccount?.(null, null);
    if (authenticated) await logout();
  }

  const anyBrowser = browsers.some((w) => mounted && w.isAvailable());

  return (
    <div className="relative">
      {account ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="pill-tag">
            {walletName} · {account.address.slice(0, 6)}…{account.address.slice(-4)}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            Switch
          </button>
          <button type="button" className="btn" onClick={() => void disconnect()}>
            Disconnect
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-solid" onClick={() => setOpen(true)}>
          Connect Wallet
        </button>
      )}

      {error && !open && <p className="mt-3 font-sans text-sm text-[var(--invalid)]">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full sm:mb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="kicker">Wallet</p>
                <h2 className="font-display mt-2 text-2xl sm:text-3xl">Select wallet</h2>
                <p className="mt-2 text-sm text-[var(--ink-mute)]">
                  Any Bitcoin wallet on mainnet. Never paste a seed / private key / WIF.
                </p>
              </div>
              <button type="button" className="btn btn-ghost !w-auto shrink-0 px-3" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ul className="mt-6 space-y-2">
              <li>
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between border border-[var(--ink)] px-4 py-3 text-left hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-40"
                  disabled={!ready || busy}
                  onClick={connectPrivy}
                >
                  <span>
                    <span className="font-display text-lg">Privy</span>
                    <span className="mt-0.5 block text-xs opacity-70">
                      Email, social, or any WalletConnect wallet
                    </span>
                  </span>
                  <span className="font-condensed text-[0.7rem] uppercase tracking-[0.12em]">
                    {busy ? "Wait" : "Ready"}
                  </span>
                </button>
              </li>
              {browsers.map((w) => {
                const installed = mounted && w.isAvailable();
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center justify-between border border-[var(--ink)] px-4 py-3 text-left hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-40"
                      disabled={!installed || busy}
                      onClick={() => void connect(w)}
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
            {mounted && !anyBrowser && (
              <p className="mt-4 text-sm text-[var(--ink-mute)]">
                No browser wallet detected. Continue with Privy, or install any Bitcoin wallet and
                refresh.
              </p>
            )}
            {error && <p className="mt-3 font-sans text-sm text-[var(--invalid)]">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
