"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { MilestoneRoadmap } from "@/components/mint/MilestoneRoadmap";
import { MintMathPlate } from "@/components/mint/MintMathPlate";
import { SupplyTrack } from "@/components/mint/SupplyTrack";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import {
  GENESIS_SUPPLY,
  PROJECT_ADDRESS,
  SUPPLY,
  UNIT_SATS,
} from "@satdust/shared";

type Quote = {
  quoteId: string;
  usd: string;
  btcUsd: string;
  feeSats: string;
  expiresAt: number;
  signature: string;
  projectAddress: string;
};

type SupplySnap = {
  totalSupply: number;
  minted: number;
  remaining: number;
  pending: number;
  availableEstimated: number;
  highContention: boolean;
};

type MilestonePayload = {
  minted: number;
  authorized: number;
  openCapacity: number;
  currentId: string;
  formula: string;
  tagline: string;
  stages: ComponentProps<typeof MilestoneRoadmap>["stages"];
  current: ComponentProps<typeof MilestoneRoadmap>["current"];
  supplyTicks: ComponentProps<typeof SupplyTrack>["ticks"];
};

export default function MintPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [supply, setSupply] = useState<SupplySnap | null>(null);
  const [milestones, setMilestones] = useState<MilestonePayload | null>(null);
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

  const refreshMilestones = useCallback(async () => {
    const res = await fetch("/api/milestones");
    setMilestones(await res.json());
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
    void refreshMilestones();
    void refreshQuote();
    void fetch("/api/network/fee")
      .then((r) => r.json())
      .then((d: { estimatedMinerFeeSats: number }) => setMinerFee(d.estimatedMinerFeeSats));
  }, [refreshQuote, refreshSupply, refreshMilestones]);

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
  const openCapacity = milestones?.openCapacity ?? 0;
  const minted = supply?.minted ?? milestones?.minted ?? 0;
  const authorized = milestones?.authorized ?? GENESIS_SUPPLY;

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
      await refreshMilestones();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mint prepare failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-5xl py-10 sm:py-14">
      <p className="byline">02 · Mint desk</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Mint</h1>
      <p className="deck mt-4 max-w-2xl">
        Mint <strong className="text-[var(--ink)]">1 SATDUST unit</strong> — that is{" "}
        <strong className="text-[var(--ink)]">1 unit</strong>, not a BRC-20 “sheet” of 1,000.{" "}
        {UNIT_SATS} sats locked in the UTXO. Slots come from Genesis or a passed vote.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel-edit">
              <p className="byline">You receive</p>
              <p className="font-display mt-2 text-2xl">1 SATDUST unit</p>
              <p className="mt-1 text-xs text-[var(--ink-mute)]">1 unit · not a 1,000 sheet</p>
            </div>
            <div className="panel-edit">
              <p className="byline">SATDUST backing</p>
              <p className="font-display mt-2 text-2xl">{UNIT_SATS} sats</p>
              <p className="mt-1 text-xs text-[var(--ink-mute)]">One UTXO · offset 0</p>
            </div>
          </div>

          <div className="panel-edit mt-4 space-y-3 font-sans text-sm">
            <Row
              label="Mint fee (1 unit)"
              value={
                quote
                  ? `$${Number(quote.usd).toFixed(2)} ≈ ${Number(quote.feeSats).toLocaleString()} sats`
                  : "loading…"
              }
            />
            <Row label="Bitcoin network fee" value={`≈ ${minerFee.toLocaleString()} sats`} />
            <div className="border-t border-[var(--ink)] pt-3">
              <Row label="Estimated total" value={`≈ ${total.toLocaleString()} sats`} emph />
            </div>
          </div>

          {quote && (
            <div className="mt-4 flex flex-wrap gap-4 font-condensed text-[0.75rem] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              <span>BTC ${Number(quote.btcUsd).toLocaleString()}</span>
              <span className="text-[var(--accent)]">
                Locked {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="mt-6">
            <WalletConnect
              onAccount={(acc, ad) => {
                setAccount(acc);
                setAdapter(ad);
              }}
            />
          </div>

          {/* Confirmed / authorized — directly above mint CTA */}
          <div className="panel-edit mt-6 border-[var(--ink)]">
            <p className="byline">Confirmed / authorized</p>
            <p className="font-display mt-1 text-4xl tracking-tight sm:text-5xl">
              {minted.toLocaleString()}
              <span className="text-[var(--ink-mute)]"> / {authorized.toLocaleString()}</span>
            </p>
            <p className="mt-2 font-sans text-sm text-[var(--ink-mute)]">
              Open now {openCapacity.toLocaleString()} units
              {supply?.pending ? ` · Pending ${supply.pending}` : ""}
              {" · "}Hard cap {SUPPLY.toLocaleString()} units
            </p>
            <p className="mt-2 font-sans text-xs leading-relaxed text-[var(--ink-mute)]">
              1 SATDUST = 1 unit (not a BRC-20 sheet of 1,000)
            </p>
          </div>

          <div className="btn-row mt-4">
            {openCapacity <= 0 ? (
              <button type="button" className="btn" disabled>
                No open mint capacity
              </button>
            ) : quoteExpired || !quote ? (
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
                Mint 1 unit
              </button>
            )}
            <Link href="#milestones" className="btn btn-ghost">
              Milestone roadmap
            </Link>
          </div>

          {openCapacity <= 0 && (
            <p className="mt-3 text-sm text-[var(--ink-mute)]">
              This window is full ({minted.toLocaleString()} / {authorized.toLocaleString()}). Next
              units need a passed milestone vote.
            </p>
          )}

          {error && <p className="mt-4 font-sans text-sm text-[var(--invalid)]">{error}</p>}

          {result && (
            <div className="panel-edit mt-8 border-[var(--valid)]">
              <p className="kicker">Submitted</p>
              <h2 className="font-display mt-2 text-2xl">Mint prepared</h2>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">{result.notice}</p>
              <p className="mt-3 font-mono text-xs text-[var(--ink-mute)]">mintId {result.mintId}</p>
            </div>
          )}
        </div>

        <aside className="panel-edit h-fit">
          <p className="kicker">Open mint</p>
          <p className="font-display mt-2 text-4xl">
            {minted.toLocaleString()}
            <span className="text-[var(--ink-mute)]"> / {authorized.toLocaleString()}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Genesis opens {GENESIS_SUPPLY.toLocaleString()} units. Later batches need hard gates +
            vote; contributors whitelist mints first. Cap {SUPPLY.toLocaleString()} units.
          </p>
          <p className="mt-3 font-sans text-xs leading-relaxed text-[var(--ink-mute)]">
            1 SATDUST = 1 unit (not a BRC-20 sheet of 1,000)
          </p>
          <p className="mt-4 font-mono text-xs text-[var(--ink-mute)]">
            Open {openCapacity.toLocaleString()} units · Pending {supply?.pending ?? 0}
          </p>
          <hr className="mag-rule my-5" />
          <p className="byline">Notes</p>
          <ul className="mt-3 space-y-2 font-sans text-sm">
            <li>
              <Link href="/docs/what-is-satdust">What is SATDUST?</Link>
            </li>
            <li>
              <Link href="/docs/tokenomics">Milestone mint</Link>
            </li>
            <li>
              <Link href="/docs/how-minting-works">Mint execution</Link>
            </li>
            <li>
              <Link href="/docs/dust20">DUST-20</Link>
            </li>
          </ul>
        </aside>
      </div>

      <MintMathPlate />

      <div id="milestones">
        {milestones && (
          <MilestoneRoadmap
            stages={milestones.stages}
            current={milestones.current}
            minted={milestones.minted}
            formula={milestones.formula}
            tagline={milestones.tagline}
          />
        )}
      </div>

      {milestones && (
        <SupplyTrack
          minted={milestones.minted}
          total={SUPPLY}
          ticks={milestones.supplyTicks}
        />
      )}

      {confirmOpen && quote && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full sm:mb-0">
            <p className="kicker">Confirmation</p>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl">You are minting</h2>
            <ul className="mt-5 space-y-2 font-sans text-sm text-[var(--ink-soft)]">
              <li className="text-[var(--ink)]">1 SATDUST unit (1 unit, not a sheet)</li>
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
