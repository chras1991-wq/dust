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
      <div className="absolute -right-2 top-8 sticker sticker-hot animate-wobble" style={{ ["--rot" as string]: "12deg" }}>
        FAIR MINT
      </div>

      <span className="sticker sticker-orange" style={{ ["--rot" as string]: "-3deg" }}>
        MINT BOOTH
      </span>
      <h1 className="hero-title mt-4 text-6xl sm:text-7xl">MINT</h1>
      <p className="mt-3 font-stamp text-xl uppercase text-[var(--c-cyan)]">
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
        <div className="panel-chaos mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-stamp text-[0.7rem] text-[var(--c-yellow)]">CONFIRMED</p>
              <p className="font-display text-4xl font-extrabold text-[var(--c-cream)]">
                {supply.minted.toLocaleString()}
                <span className="text-[var(--c-magenta)]"> / {supply.totalSupply.toLocaleString()}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="sticker sticker-cyan" style={{ ["--rot" as string]: "2deg" }}>
                PENDING {supply.pending}
              </span>
              <span className="sticker sticker-lime" style={{ ["--rot" as string]: "-2deg" }}>
                LEFT {supply.remaining}
              </span>
              {supply.highContention && (
                <span className="sticker sticker-hot animate-wobble" style={{ ["--rot" as string]: "5deg" }}>
                  HIGH CONTENTION
                </span>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-dim)]">
            No reservation. Valid only after confirmation + DUST-20 indexer acceptance.
          </p>
        </div>
      )}

      <div className="panel-lime mt-6 space-y-3 font-mono text-sm">
        <Row label="You receive" value="1 SATDUST" color="var(--c-lime)" />
        <Row label="SATDUST backing" value={`${UNIT_SATS} sats`} color="var(--c-yellow)" />
        <Row
          label="Mint fee"
          value={quote ? `$7.00 ≈ ${Number(quote.feeSats).toLocaleString()} sats` : "loading…"}
          color="var(--c-magenta)"
        />
        <Row label="Bitcoin network fee" value={`≈ ${minerFee.toLocaleString()} sats`} color="var(--c-cyan)" />
        <div className="border-t-[3px] border-dashed border-[var(--c-lime)] pt-3">
          <Row label="Estimated total" value={`≈ ${total.toLocaleString()} sats`} color="var(--c-orange)" emph />
        </div>
      </div>

      {quote && (
        <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[0.75rem]">
          <span className="sticker sticker-yellow" style={{ ["--rot" as string]: "-2deg" }}>
            BTC ${Number(quote.btcUsd).toLocaleString()}
          </span>
          <span className="sticker sticker-hot" style={{ ["--rot" as string]: "3deg" }}>
            LOCK {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </span>
          <span className="text-[var(--ink-dim)]">{quote.quoteId}</span>
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

      {error && <p className="mt-4 font-stamp text-sm text-[var(--invalid)]">{error}</p>}

      {result && (
        <div className="panel-chaos mt-10" style={{ boxShadow: "8px 8px 0 var(--c-lime)" }}>
          <span className="sticker sticker-lime">SUBMITTED</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold uppercase text-[var(--c-lime)]">
            Mint prepared
          </h2>
          <p className="mt-3 text-sm text-[var(--ink-dim)]">{result.notice}</p>
          <p className="mt-3 font-mono text-[0.75rem] text-[var(--c-yellow)]">mintId {result.mintId}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,3,8,0.85)] p-4">
          <div className="panel-chaos w-full max-w-md">
            <span className="sticker sticker-hot">CONFIRM</span>
            <h2 className="font-display mt-3 text-3xl font-extrabold uppercase">You are minting</h2>
            <ul className="mt-5 space-y-2 font-mono text-sm">
              <li className="text-[var(--c-lime)]">1 SATDUST</li>
              <li className="text-[var(--c-yellow)]">{UNIT_SATS} sats backing</li>
              <li className="text-[var(--c-magenta)]">Project fee {feeSats.toLocaleString()} sats</li>
              <li className="text-[var(--c-cyan)]">Network ≈ {minerFee.toLocaleString()} sats</li>
              <li className="font-stamp text-[var(--c-orange)]">
                TOTAL ≈ {total.toLocaleString()} sats
              </li>
            </ul>
            <p className="mt-4 break-all font-mono text-[0.65rem] text-[var(--ink-dim)]">
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
      <span
        className={emph ? "font-stamp text-base" : ""}
        style={{ color: color ?? "var(--ink)" }}
      >
        {value}
      </span>
    </div>
  );
}
