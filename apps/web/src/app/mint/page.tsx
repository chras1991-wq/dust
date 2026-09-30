"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { HolderTop10 } from "@/components/mint/HolderTop10";
import { MilestoneRoadmap } from "@/components/mint/MilestoneRoadmap";
import { MintMathPlate } from "@/components/mint/MintMathPlate";
import { SupplyTrack } from "@/components/mint/SupplyTrack";
import { executeMintPayment, type MintPayProgress } from "@/lib/mint-pay";
import { useSmoothMintProgress } from "@/hooks/useSmoothMintProgress";
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
  quantity?: number;
  unitFeeSats?: string;
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
  preparing: "Preparing payment…",
  awaiting_wallet: "Confirm the transfer in your wallet…",
  done: "Payment sent",
};

export default function MintPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [adapter, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [supply, setSupply] = useState<SupplySnap | null>(null);
  const { liveMinted, bumpReal, refreshReal } = useSmoothMintProgress();
  const [holders, setHolders] = useState<{ rank: number; address: string; amount: number }[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<MilestonePayload | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<MintPayProgress | null>(null);
  const [result, setResult] = useState<{
    mintId: string;
    notice: string;
    txid?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const walletOpenRef = useRef<(() => void) | null>(null);

  const refreshSupply = useCallback(async () => {
    const res = await fetch("/api/supply");
    setSupply(await res.json());
  }, []);

  const refreshHolders = useCallback(async () => {
    const res = await fetch("/api/holders/top");
    if (res.ok) {
      const data = await res.json();
      setHolders(data.holders ?? []);
    }
  }, []);

  const refreshWalletBalance = useCallback(async (address: string) => {
    const res = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`);
    if (res.ok) {
      const data = await res.json();
      setWalletBalance(data.balance ?? 0);
    }
  }, []);

  const refreshMilestones = useCallback(async () => {
    const res = await fetch("/api/milestones");
    setMilestones(await res.json());
  }, []);

  const refreshQuote = useCallback(async () => {
    setError(null);
    const mintQty = parseMintQuantity(quantityInput);
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: mintQty }),
    });
    if (!res.ok) {
      setError("Failed to fetch signed quote");
      return;
    }
    const nextQuote = (await res.json()) as Quote;
    if (!nextQuote.quoteId || !nextQuote.feeSats) {
      setError("Failed to fetch signed quote");
      return;
    }
    setQuote(nextQuote);
  }, [quantityInput]);

  useEffect(() => {
    void refreshSupply();
    void refreshMilestones();
    void refreshQuote();
    void refreshHolders();
  }, [refreshQuote, refreshSupply, refreshMilestones, refreshHolders]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshHolders();
      void refreshSupply();
      if (account) void refreshWalletBalance(account.address);
    }, 20_000);
    return () => clearInterval(id);
  }, [account, refreshHolders, refreshSupply, refreshWalletBalance]);

  useEffect(() => {
    if (account) void refreshWalletBalance(account.address);
    else setWalletBalance(null);
  }, [account, refreshWalletBalance]);

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

  const qty = parseMintQuantity(quantityInput);
  const unitFeeSats = quote?.unitFeeSats
    ? Number(quote.unitFeeSats)
    : quote
      ? Math.round(Number(quote.feeSats) / qty)
      : 0;
  const carrierSats = UNIT_SATS * qty;
  const totalFeeSats = unitFeeSats * qty;
  const totalSats = carrierSats + totalFeeSats;
  const btcPrice = quote ? Number(quote.btcUsd) : 0;
  const totalBtc = btcPrice > 0 ? totalSats / 100_000_000 : 0;
  const quoteExpired = secondsLeft <= 0;
  const openCapacity = milestones?.openCapacity ?? 0;
  const displayMinted = liveMinted;
  const authorized = milestones?.authorized ?? GENESIS_SUPPLY;

  function requestMint() {
    setError(null);
    if (!account || !adapter) {
      walletOpenRef.current?.();
      setError("Connect UniSat or OKX Wallet first, then mint.");
      return;
    }
    if (!quote) void refreshQuote();
    setConfirmOpen(true);
  }

  async function confirmAndPay() {
    if (!account || !adapter) return;
    setBusy(true);
    setError(null);
    setProgress("preparing");
    try {
      await refreshQuote();
      const paid = await executeMintPayment({
        account,
        adapter,
        quoteId: quote?.quoteId,
        quantity: qty,
        onProgress: setProgress,
      });
      setResult({
        mintId: paid.mintId,
        notice: paid.notice,
        txid: paid.txid,
      });
      setConfirmOpen(false);
      await refreshSupply();
      await refreshMilestones();
      await refreshQuote();
      bumpReal(qty);
      await refreshReal();
      await refreshHolders();
      await refreshWalletBalance(account.address);
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
        Mint <strong className="text-[var(--ink)]">SATDUST</strong> on Bitcoin L1 — {UNIT_SATS} sats
        locked per token in a carrier UTXO.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
        <div>
          <div className="panel-edit">
            <label className="byline" htmlFor="mint-qty">Amount</label>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <input
                id="mint-qty"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={quantityInput}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "");
                  setQuantityInput(next);
                }}
                onBlur={() => {
                  const q = parseMintQuantity(quantityInput);
                  setQuantityInput(String(q));
                  void refreshQuote();
                }}
                className="font-display w-28 border border-[var(--ink)] bg-transparent px-3 py-2 text-3xl tracking-tight outline-none"
              />
              <span className="pb-2 font-sans text-sm text-[var(--ink-mute)]">SATDUST</span>
              {walletBalance !== null && account && (
                <span className="pb-2 font-sans text-sm text-[var(--valid)]">
                  Your balance · {walletBalance.toLocaleString()} SATDUST
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="panel-edit">
              <p className="byline">Backing (carrier)</p>
              <p className="font-display mt-2 text-2xl">{carrierSats.toLocaleString()} sats</p>
            </div>
            <div className="panel-edit">
              <p className="byline">Mint fee</p>
              <p className="font-display mt-2 text-2xl">
                {quote ? `$${(qty * 1).toFixed(2)}` : "…"}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-mute)]">
                {unitFeeSats.toLocaleString()} sats / token
              </p>
            </div>
          </div>

          <div className="panel-edit mt-4 space-y-3 font-sans text-sm">
            <Row
              label="Mint fee (total)"
              value={
                quote
                  ? `${totalFeeSats.toLocaleString()} sats · $${Number(quote.usd).toFixed(2)}`
                  : "loading…"
              }
            />
            <p className="text-xs text-[var(--ink-mute)]">
              One BTC transfer for all {qty} tokens ({qty}×{UNIT_SATS} carrier + {qty}× mint fee).
              Miner fee is separate in your wallet — not in this sats total.
            </p>
            <div className="border-t border-[var(--ink)] pt-3 mt-3">
              <Row
                label="Estimated total"
                value={
                  quote
                    ? `≈ ${totalSats.toLocaleString()} sats · ${totalBtc.toFixed(8)} BTC`
                    : "…"
                }
                emph
              />
            </div>
          </div>

          {quote && (
            <div className="mt-4 flex flex-wrap gap-4 font-condensed text-[0.75rem] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              <span>BTC/USD ${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span>
                1 SAT = {(1 / 100_000_000).toFixed(8)} BTC
              </span>
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
                UniSat or OKX on Bitcoin mainnet. Payment is sent from your wallet — no address copy
                on this page.
              </p>
            )}
          </div>

          <div className="panel-edit mt-6 border-[var(--ink)]">
            <p className="byline">Mint progress</p>
            <p className="font-display mt-1 text-4xl tracking-tight sm:text-5xl">
              {displayMinted.toLocaleString()}
              <span className="text-[var(--ink-mute)]"> / {authorized.toLocaleString()}</span>
            </p>
            <p className="mt-2 font-sans text-sm text-[var(--ink-mute)]">
              Open slots {openCapacity.toLocaleString()}
              {supply?.pending ? ` · Pending ${supply.pending}` : ""}
              {" · "}Cap {SUPPLY.toLocaleString()}
            </p>
          </div>

          <div className="btn-row mt-4 flex-col items-stretch sm:flex-row sm:items-center">
            <button
              type="button"
              className="btn btn-solid"
              disabled={busy}
              onClick={requestMint}
            >
              {account ? `Pay & Mint ${qty} SATDUST` : "Connect & Mint"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void refreshQuote()}>
              Refresh price
            </button>
            <Link href="#milestones" className="btn btn-ghost">
              Milestone roadmap
            </Link>
          </div>
          {busy && progress && (
            <p className="mt-3 font-sans text-sm text-[var(--accent)]">
              {PROGRESS_LABEL[progress]}
            </p>
          )}

          {error && <p className="mt-4 font-sans text-sm text-[var(--invalid)]">{error}</p>}

          {result && (
            <div className="panel-edit mt-8 border-[var(--valid)]">
              <p className="kicker">Broadcast</p>
              <h2 className="font-display mt-2 text-2xl">Mint payment sent</h2>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">{result.notice}</p>
              <p className="mt-3 font-mono text-xs text-[var(--ink-mute)]">mintId {result.mintId}</p>
              {result.txid && (
                <p className="mt-2 break-all font-mono text-xs">
                  Tx{" "}
                  <a
                    href={`https://mempool.space/tx/${result.txid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.txid}
                  </a>
                </p>
              )}
            </div>
          )}

          <HolderTop10 holders={holders} />
        </div>

        <aside className="panel-edit h-fit">
          <p className="kicker">Live desk</p>
          <p className="font-display mt-2 text-4xl">
            {displayMinted.toLocaleString()}
            <span className="text-[var(--ink-mute)]"> minted</span>
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Genesis {GENESIS_SUPPLY.toLocaleString()} SATDUST. Per-wallet mint has no cap in this
            window — enter any quantity above.
          </p>
          <p className="mt-4 font-mono text-xs text-[var(--ink-mute)]">
            Real confirmed {supply?.minted ?? 0} · Pending {supply?.pending ?? 0}
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
            minted={displayMinted}
            formula={milestones.formula}
            tagline={milestones.tagline}
          />
        )}
      </div>

      {milestones && (
        <SupplyTrack
          minted={displayMinted}
          total={SUPPLY}
          ticks={milestones.supplyTicks}
        />
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full sm:mb-0">
            <p className="kicker">Confirmation</p>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl">One BTC payment</h2>
            <ul className="mt-5 space-y-2 font-sans text-sm text-[var(--ink-soft)]">
              <li className="text-[var(--ink)]">{qty} SATDUST · single order</li>
              <li>
                Carrier {UNIT_SATS.toLocaleString()} × {qty} = {carrierSats.toLocaleString()} sats
              </li>
              <li>
                Mint fee ${(qty * 1).toFixed(2)} ≈ {totalFeeSats.toLocaleString()} sats (
                {unitFeeSats.toLocaleString()}/ea)
              </li>
              <li className="font-display text-lg text-[var(--accent)]">
                Pay {totalBtc.toFixed(8)} BTC ({totalSats.toLocaleString()} sats)
              </li>
            </ul>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              One on-chain transfer settles the full batch in BTC. Wallet miner fee is extra and not
              included above. No order lock — mint again anytime.
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

function parseMintQuantity(raw: string): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
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
