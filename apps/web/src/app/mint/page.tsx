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
  const [result, setResult] = useState<{
    mintId: string;
    notice: string;
  } | null>(null);
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
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-pink animate-floaty">mint booth</span>
      <h1 className="hologram-text hero-title mt-4 text-6xl sm:text-7xl">MINT</h1>
      <p className="mt-3 font-mono text-xl text-[var(--cyan)]">
        1 SATDUST · carrier {UNIT_SATS} · offset 0
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
        <div className="panel-y2k mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-pixel text-[0.55rem] text-[var(--pink)]">confirmed</p>
              <p className="chrome-text mt-1 text-4xl">
                {supply.minted.toLocaleString()}
                <span className="text-[var(--pink)]"> / {supply.totalSupply.toLocaleString()}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="pill pill-cyan">pending {supply.pending}</span>
              <span className="pill pill-lime">left {supply.remaining}</span>
              {supply.highContention && (
                <span className="pill pill-pink animate-sparkle">high contention</span>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-dim)]">
            No reservation. Valid only after confirmation + DUST-20 indexer acceptance.
          </p>
        </div>
      )}

      <div className="panel-chrome mt-6 space-y-3 font-mono text-xl">
        <Row label="You receive" value="1 SATDUST" color="var(--lime)" />
        <Row label="SATDUST backing" value={`${UNIT_SATS} sats`} color="var(--cyan)" />
        <Row
          label="Mint fee"
          value={quote ? `$7.00 ≈ ${Number(quote.feeSats).toLocaleString()} sats` : "loading…"}
          color="var(--pink)"
        />
        <Row label="Bitcoin network fee" value={`≈ ${minerFee.toLocaleString()} sats`} color="var(--blue)" />
        <div className="border-t border-dashed border-white/30 pt-3">
          <Row label="Estimated total" value={`≈ ${total.toLocaleString()} sats`} color="var(--lime)" emph />
        </div>
      </div>

      {quote && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="pill pill-chrome">btc ${Number(quote.btcUsd).toLocaleString()}</span>
          <span className="pill pill-pink">
            lock {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </span>
          <span className="font-mono text-lg text-[var(--ink-dim)]">{quote.quoteId}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
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

      {error && <p className="mt-4 font-pixel text-[0.6rem] text-[var(--invalid)]">{error}</p>}

      {result && (
        <div className="panel-y2k mt-10">
          <span className="pill pill-lime">submitted</span>
          <h2 className="chrome-text mt-3 text-3xl">Mint prepared</h2>
          <p className="mt-3 text-sm text-[var(--ink-dim)]">{result.notice}</p>
          <p className="mt-3 font-mono text-lg text-[var(--cyan)]">mintId {result.mintId}</p>
          <div className="mt-5 flex flex-wrap gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,6,20,0.88)] p-4 backdrop-blur-sm">
          <div className="panel-y2k w-full max-w-md">
            <span className="pill pill-pink">confirm</span>
            <h2 className="hologram-text mt-3 text-3xl">You are minting</h2>
            <ul className="mt-5 space-y-2 font-mono text-xl">
              <li className="text-[var(--lime)]">1 SATDUST</li>
              <li className="text-[var(--cyan)]">{UNIT_SATS} sats backing</li>
              <li className="text-[var(--pink)]">Project fee {feeSats.toLocaleString()} sats</li>
              <li className="text-[var(--blue)]">Network ≈ {minerFee.toLocaleString()} sats</li>
              <li className="font-display text-base font-bold text-[var(--lime)]">
                TOTAL ≈ {total.toLocaleString()} sats
              </li>
            </ul>
            <p className="mt-4 break-all font-mono text-base text-[var(--ink-dim)]">
              Fee → {PROJECT_ADDRESS}
            </p>
            <div className="mt-6 flex gap-3">
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

function Row({
  label,
  value,
  color,
  emph,
}: {
  label: string;
  value: string;
  color?: string;
  emph?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[var(--ink-dim)]">{label}</span>
      <span className={emph ? "font-display text-base font-bold" : ""} style={{ color: color ?? "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}
