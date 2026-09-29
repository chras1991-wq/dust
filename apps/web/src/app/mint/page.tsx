"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { PROJECT_ADDRESS, UNIT_SATS } from "@satdust/shared";

type Quote = {
  quoteId: string;
  usd: string;
  btcUsd: string;
  feeSats: string;
  expiresAt: number;
  signature: string;
  projectAddress: string;
};

type Supply = {
  totalSupply: number;
  minted: number;
  remaining: number;
  pending: number;
  availableEstimated: number;
  highContention: boolean;
};

export default function MintPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [supply, setSupply] = useState<Supply | null>(null);
  const [minerFee, setMinerFee] = useState<number>(2500);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ mintId: string; notice: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSupply = useCallback(async () => {
    const res = await fetch("/api/supply");
    setSupply(await res.json());
  }, []);

  const refreshQuote = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/quote", { method: "POST" });
    if (!res.ok) {
      setError("Failed to fetch signed quote");
      return;
    }
    const q = (await res.json()) as Quote;
    if (q.projectAddress !== PROJECT_ADDRESS) {
      setError("ABORT: backend returned unexpected project address");
      setQuote(null);
      return;
    }
    setQuote(q);
  }, []);

  useEffect(() => {
    void refreshSupply();
    void refreshQuote();
    void fetch("/api/network/fee")
      .then((r) => r.json())
      .then((d: { estimatedMinerFeeSats: number }) => setMinerFee(d.estimatedMinerFeeSats));
  }, [refreshQuote, refreshSupply]);

  useEffect(() => {
    if (!quote) return;
    const tick = () => {
      const left = Math.max(0, quote.expiresAt - Math.floor(Date.now() / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [quote]);

  const feeSats = Number(quote?.feeSats ?? 0);
  const total = UNIT_SATS + feeSats + minerFee;
  const quoteExpired = secondsLeft <= 0;

  async function prepareMint() {
    if (!account || !quote) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mint/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address,
          publicKey: account.publicKey,
          quoteId: quote.quoteId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prepare failed");
      setResult({ mintId: data.mintId, notice: data.notice });
      setConfirmOpen(false);
      await refreshSupply();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mint prepare failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Operations · Mint desk</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Mint</h1>
      <p className="deck mt-4 max-w-xl">
        One SATDUST on a {UNIT_SATS}-sat carrier. Price locked for this quote below.
      </p>
      <p className="mt-3 break-words font-mono text-sm text-[var(--accent)]">
        1 SATDUST · carrier {UNIT_SATS} sats · offset 0
      </p>

      <div className="mt-8">
        <WalletConnect
          onAccount={(acc, ad) => {
            setAccount(acc);
            setAdapter(ad);
          }}
        />
      </div>

      {supply && (
        <div className="panel-edit mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="byline">Confirmed</p>
              <p className="font-display mt-1 text-3xl sm:text-4xl">
                {supply.minted.toLocaleString()}
                <span className="text-[var(--ink-mute)]"> / {supply.totalSupply.toLocaleString()}</span>
              </p>
            </div>
            <div className="font-condensed text-[0.75rem] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              Pending {supply.pending} · Left {supply.remaining}
              {supply.highContention && (
                <span className="mt-1 block text-[var(--accent)] sm:ml-3 sm:mt-0 sm:inline">
                  High contention
                </span>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-mute)]">
            No reservation. Valid only after confirmation + DUST-20 indexer acceptance.
          </p>
        </div>
      )}

      <div className="panel-edit mt-6 space-y-3 font-sans text-sm">
        <Row label="You receive" value="1 SATDUST" />
        <Row label="SATDUST backing" value={`${UNIT_SATS} sats`} />
        <Row
          label="Mint fee"
          value={quote ? `$7.00 ≈ ${Number(quote.feeSats).toLocaleString()} sats` : "loading…"}
        />
        <Row label="Bitcoin network fee" value={`≈ ${minerFee.toLocaleString()} sats`} />
        <div className="border-t border-[var(--ink)] pt-3">
          <Row label="Estimated total" value={`≈ ${total.toLocaleString()} sats`} emph />
        </div>
      </div>

      {quote && (
        <div className="mt-5 flex flex-wrap gap-4 font-condensed text-[0.75rem] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
          <span>BTC ${Number(quote.btcUsd).toLocaleString()}</span>
          <span className="text-[var(--accent)]">
            Locked {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </span>
          <span>{quote.quoteId}</span>
        </div>
      )}

      <div className="btn-row mt-8">
        {quoteExpired || !quote ? (
          <button type="button" className="btn btn-solid" onClick={() => void refreshQuote()}>
            Refresh Price
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-solid"
            disabled={!account || busy}
            onClick={() => setConfirmOpen(true)}
          >
            Mint 1 SATDUST
          </button>
        )}
        <Link href="/docs/how-minting-works" className="btn btn-ghost">
          How it works
        </Link>
      </div>

      {error && <p className="mt-4 font-sans text-sm text-[var(--invalid)]">{error}</p>}

      {result && (
        <div className="panel-edit mt-10 border-[var(--valid)]">
          <p className="kicker">Submitted</p>
          <h2 className="font-display mt-2 text-3xl">Mint prepared</h2>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{result.notice}</p>
          <p className="mt-3 font-mono text-xs text-[var(--ink-mute)]">mintId {result.mintId}</p>
          <div className="btn-row mt-5">
            <Link href="/verify" className="btn">
              Verify
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setResult(null);
                void refreshQuote();
              }}
            >
              Mint another
            </button>
          </div>
        </div>
      )}

      {confirmOpen && quote && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full sm:mb-0">
            <p className="kicker">Confirmation</p>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl">You are minting</h2>
            <ul className="mt-5 space-y-2 font-sans text-sm text-[var(--ink-soft)]">
              <li className="text-[var(--ink)]">1 SATDUST</li>
              <li>{UNIT_SATS} sats backing</li>
              <li>Project fee {feeSats.toLocaleString()} sats</li>
              <li>Network ≈ {minerFee.toLocaleString()} sats</li>
              <li className="font-display text-lg text-[var(--accent)]">
                Total ≈ {total.toLocaleString()} sats
              </li>
            </ul>
            <p className="mt-4 break-all font-mono text-xs text-[var(--ink-mute)]">
              Fee → {PROJECT_ADDRESS}
            </p>
            <div className="btn-row mt-6">
              <button type="button" className="btn btn-solid" disabled={busy} onClick={() => void prepareMint()}>
                Confirm &amp; Sign
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, emph }: { label: string; value: string; emph?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[var(--ink-mute)]">{label}</span>
      <span className={emph ? "font-display text-base text-[var(--accent)]" : "text-[var(--ink)]"}>
        {value}
      </span>
    </div>
  );
}
