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
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ Mint</p>
      <h1 className="font-display mt-2 text-5xl tracking-tight">MINT SATDUST</h1>
      <p className="mt-4 text-[var(--ink-dim)]">
        One unit per transaction. Carrier output must be exactly {UNIT_SATS} sats at
        inscription offset 0.
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
        <div className="mt-10 border border-[var(--rule)] bg-[var(--bg-1)] p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                Confirmed minted
              </p>
              <p className="font-mono mt-1 text-2xl text-[var(--ink)]">
                {supply.minted.toLocaleString()}{" "}
                <span className="text-[var(--ink-dim)]">/ {supply.totalSupply.toLocaleString()}</span>
              </p>
            </div>
            <div className="font-mono text-[0.75rem] text-[var(--ink-dim)]">
              Pending {supply.pending} · Remaining {supply.remaining}
              {supply.highContention && (
                <span className="ml-3 text-[var(--accent)]">HIGH CONTENTION</span>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-dim)]">
            Availability is not guaranteed until confirmation and DUST-20 indexer
            acceptance. No reservation of sequence numbers.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3 font-mono text-sm">
        <Row label="You receive" value="1 SATDUST" />
        <Row label="SATDUST backing" value={`${UNIT_SATS} sats`} />
        <Row
          label="Mint fee"
          value={
            quote
              ? `$7.00 ≈ ${Number(quote.feeSats).toLocaleString()} sats`
              : "loading…"
          }
        />
        <Row label="Bitcoin network fee" value={`≈ ${minerFee.toLocaleString()} sats`} />
        <div className="border-t border-[var(--rule)] pt-3">
          <Row
            label="Estimated total"
            value={`≈ ${total.toLocaleString()} sats`}
            emph
          />
        </div>
      </div>

      {quote && (
        <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[0.75rem] text-[var(--ink-dim)]">
          <span>BTC/USD ${Number(quote.btcUsd).toLocaleString()}</span>
          <span>
            Price locked for{" "}
            <span className={quoteExpired ? "text-[var(--invalid)]" : "text-[var(--accent)]"}>
              {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </span>
          </span>
          <span className="text-[var(--ink-faint)]">{quote.quoteId}</span>
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
          How minting works
        </Link>
      </div>

      {error && (
        <p className="mt-4 font-mono text-sm text-[var(--invalid)]">{error}</p>
      )}

      {result && (
        <div className="mt-10 border border-[var(--valid)] bg-[var(--bg-1)] p-5">
          <p className="section-num">Status</p>
          <h2 className="font-display mt-2 text-2xl text-[var(--valid)]">
            SATDUST MINT PREPARED
          </h2>
          <p className="mt-3 text-sm text-[var(--ink-dim)]">{result.notice}</p>
          <p className="mt-3 font-mono text-[0.75rem] text-[var(--ink-faint)]">
            mintId {result.mintId}
          </p>
          <p className="mt-4 text-sm text-[var(--ink-dim)]">
            Next: sign commit PSBT in wallet → broadcast → reveal with carrier{" "}
            {UNIT_SATS} sats @ offset 0 and project fee output.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/verify" className="btn">
              Verify SATDUST
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md border border-[var(--rule)] bg-[var(--bg-1)] p-6">
            <p className="section-num">Confirmation</p>
            <h2 className="font-display mt-2 text-2xl">YOU ARE MINTING</h2>
            <ul className="mt-5 space-y-2 font-mono text-sm text-[var(--ink-dim)]">
              <li className="text-[var(--ink)]">1 SATDUST</li>
              <li>{UNIT_SATS} sats backing</li>
              <li>Project fee {feeSats.toLocaleString()} sats</li>
              <li>Bitcoin network fee ≈ {minerFee.toLocaleString()} sats</li>
              <li className="text-[var(--ink)]">
                Estimated total ≈ {total.toLocaleString()} sats
              </li>
            </ul>
            <p className="mt-4 font-mono text-[0.65rem] text-[var(--ink-faint)] break-all">
              Fee → {PROJECT_ADDRESS}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="btn btn-solid"
                disabled={busy}
                onClick={() => void prepareMint()}
              >
                Confirm &amp; Sign
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmOpen(false)}
              >
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
  emph,
}: {
  label: string;
  value: string;
  emph?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[var(--ink-dim)]">{label}</span>
      <span className={emph ? "text-[var(--accent)]" : "text-[var(--ink)]"}>{value}</span>
    </div>
  );
}
