"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { MilestoneRoadmap } from "@/components/mint/MilestoneRoadmap";
import { MintMathPlate } from "@/components/mint/MintMathPlate";
import { SupplyTrack } from "@/components/mint/SupplyTrack";
import { executeMintPayment, type MintPayProgress } from "@/lib/mint-pay";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import {
  GENESIS_SUPPLY,
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

const PROGRESS_LABEL: Record<MintPayProgress, string> = {
  preparing: "Preparing mint…",
  awaiting_wallet: "Open your wallet and confirm payment…",
  funding: "Funding received — building reveal…",
  revealing: "Signing reveal inscription…",
  broadcasting: "Broadcasting reveal…",
  done: "Mint broadcast",
};

export default function MintPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [adapter, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [supply, setSupply] = useState<SupplySnap | null>(null);
  const [milestones, setMilestones] = useState<MilestonePayload | null>(null);
  const [minerFee, setMinerFee] = useState<number>(2500);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<MintPayProgress | null>(null);
  const [result, setResult] = useState<{
    mintId: string;
    notice: string;
    commitTxid?: string;
    revealTxid?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const walletOpenRef = useRef<(() => void) | null>(null);

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
    if (!q.quoteId || !q.feeSats) {
      setError("Failed to fetch signed quote");
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

  function requestMint() {
    setError(null);
    if (!account || !adapter) {
      walletOpenRef.current?.();
      setError("Connect UniSat or OKX Wallet first, then mint.");
      return;
    }
    if (!quote || quoteExpired) {
      void refreshQuote();
      setError("Price locked expired — refreshed. Tap Mint again.");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmAndPay() {
    if (!account || !adapter || !quote) return;
    setBusy(true);
    setError(null);
    setProgress("preparing");
    try {
      const paid = await executeMintPayment({
        account,
        adapter,
        quoteId: quote.quoteId,
        projectFeeSats: Number(quote.feeSats),
        revealMinerFeeSats: Math.max(minerFee, 400),
        onProgress: setProgress,
      });
      setResult({
        mintId: paid.mintId,
        notice: paid.notice,
        commitTxid: paid.commitTxid,
        revealTxid: paid.revealTxid,
      });
      setConfirmOpen(false);
      await refreshSupply();
      await refreshMilestones();
      await refreshQuote();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mint payment failed");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-5xl py-10 sm:py-14">
      <p className="byline">02 · Mint desk</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Mint</h1>
      <p className="deck mt-4 max-w-2xl">
        Mint <strong className="text-[var(--ink)]">1 SATDUST</strong> — {UNIT_SATS} sats locked in
        the UTXO. Slots come from Genesis or a passed vote.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel-edit">
              <p className="byline">You receive</p>
              <p className="font-display mt-2 text-2xl">1 SATDUST</p>
            </div>
            <div className="panel-edit">
              <p className="byline">SATDUST backing</p>
              <p className="font-display mt-2 text-2xl">{UNIT_SATS} sats</p>
              <p className="mt-1 text-xs text-[var(--ink-mute)]">One UTXO · offset 0</p>
            </div>
          </div>

          <div className="panel-edit mt-4 space-y-3 font-sans text-sm">
            <Row
              label="Mint fee (1 SATDUST)"
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
              registerOpen={(open) => {
                walletOpenRef.current = open;
              }}
            />
            {!account && (
              <p className="mt-2 text-sm text-[var(--ink-mute)]">
                Mint needs UniSat or OKX on Bitcoin mainnet. The wallet popup is the payment step.
              </p>
            )}
          </div>

          {/* Confirmed / authorized — directly above mint CTA */}
          <div className="panel-edit mt-6 border-[var(--ink)]">
            <p className="byline">Confirmed / authorized</p>
            <p className="font-display mt-1 text-4xl tracking-tight sm:text-5xl">
              {minted.toLocaleString()}
              <span className="text-[var(--ink-mute)]"> / {authorized.toLocaleString()}</span>
            </p>
            <p className="mt-2 font-sans text-sm text-[var(--ink-mute)]">
              Open now {openCapacity.toLocaleString()}
              {supply?.pending ? ` · Pending ${supply.pending}` : ""}
              {" · "}Hard cap {SUPPLY.toLocaleString()}
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
                disabled={busy}
                onClick={requestMint}
              >
                {account ? "Mint 1 SATDUST" : "Connect & Mint"}
              </button>
            )}
            <Link href="#milestones" className="btn btn-ghost">
              Milestone roadmap
            </Link>
          </div>
          {busy && progress && (
            <p className="mt-3 font-sans text-sm text-[var(--accent)]">
              {PROGRESS_LABEL[progress]}
            </p>
          )}

          {openCapacity <= 0 && (
            <p className="mt-3 text-sm text-[var(--ink-mute)]">
              This window is full ({minted.toLocaleString()} / {authorized.toLocaleString()}). Next
              tokens need a passed milestone vote.
            </p>
          )}

          {error && <p className="mt-4 font-sans text-sm text-[var(--invalid)]">{error}</p>}

          {result && (
            <div className="panel-edit mt-8 border-[var(--valid)]">
              <p className="kicker">Broadcast</p>
              <h2 className="font-display mt-2 text-2xl">Mint payment sent</h2>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">{result.notice}</p>
              <p className="mt-3 font-mono text-xs text-[var(--ink-mute)]">mintId {result.mintId}</p>
              {result.commitTxid && (
                <p className="mt-2 break-all font-mono text-xs">
                  Commit{" "}
                  <a
                    href={`https://mempool.space/tx/${result.commitTxid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.commitTxid}
                  </a>
                </p>
              )}
              {result.revealTxid && (
                <p className="mt-1 break-all font-mono text-xs">
                  Reveal{" "}
                  <a
                    href={`https://mempool.space/tx/${result.revealTxid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.revealTxid}
                  </a>
                </p>
              )}
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
            Genesis opens {GENESIS_SUPPLY.toLocaleString()} SATDUST. Later batches need hard gates +
            vote; contributors whitelist mints first. Cap {SUPPLY.toLocaleString()}.
          </p>
          <p className="mt-4 font-mono text-xs text-[var(--ink-mute)]">
            Open {openCapacity.toLocaleString()} · Pending {supply?.pending ?? 0}
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
              <li className="text-[var(--ink)]">1 SATDUST</li>
              <li>{UNIT_SATS} sats backing</li>
              <li>Mint fee {feeSats.toLocaleString()} sats</li>
              <li>Network ≈ {minerFee.toLocaleString()} sats</li>
              <li className="font-display text-lg text-[var(--accent)]">
                Total ≈ {total.toLocaleString()} sats
              </li>
            </ul>
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Next: confirm in your wallet. We then broadcast the reveal (546-sat carrier + mint
              fee) automatically.
            </p>
            {busy && progress && (
              <p className="mt-3 font-sans text-sm text-[var(--accent)]">
                {PROGRESS_LABEL[progress]}
              </p>
            )}
            {error && <p className="mt-3 font-sans text-sm text-[var(--invalid)]">{error}</p>}
            <div className="btn-row mt-6">
              <button
                type="button"
                className="btn btn-solid"
                disabled={busy || !account || !adapter}
                onClick={() => void confirmAndPay()}
              >
                {busy ? "Paying…" : "Confirm & Pay in Wallet"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
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
