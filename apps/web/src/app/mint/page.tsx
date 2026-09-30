"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { MilestoneRoadmap } from "@/components/mint/MilestoneRoadmap";
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
  const { liveMinted, authorized: progressAuthorized, progressReady, bumpReal, refreshReal } = useSmoothMintProgress();
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
  }, [refreshQuote, refreshSupply, refreshMilestones]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshSupply();
      if (account) void refreshWalletBalance(account.address);
    }, 20_000);
    return () => clearInterval(id);
  }, [account, refreshSupply, refreshWalletBalance]);

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
  const paySatsTotal = quote ? Math.round(Number(quote.feeSats)) : 0;
  const carrierSats = UNIT_SATS * qty;
  const unitPaySats = qty > 0 && paySatsTotal > 0 ? Math.round(paySatsTotal / qty) : 0;
  const unitProjectFeeSats =
    quote?.unitFeeSats && Number(quote.unitFeeSats) < unitPaySats
      ? Number(quote.unitFeeSats)
      : qty > 0
        ? Math.max(0, Math.round((paySatsTotal - carrierSats) / qty))
        : 0;
  const totalSats = paySatsTotal;
  const btcPrice = quote ? Number(quote.btcUsd) : 0;
  const totalBtc = btcPrice > 0 ? totalSats / 100_000_000 : 0;
  const quoteExpired = secondsLeft <= 0;
  const openCapacity = milestones?.openCapacity ?? 0;
  const displayMinted = liveMinted ?? 0;
  const authorized = progressAuthorized ?? milestones?.authorized ?? GENESIS_SUPPLY;

  function requestMint() {
    setError(null);
    if (!account || !adapter) {
      walletOpenRef.current?.();
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
          <div className="panel-edit space-y-3">
            <p className="font-sans text-xs text-[var(--ink-mute)] sm:text-sm">
              Minted{" "}
              <span className="font-display text-lg text-[var(--ink)] tabular-nums">
                {progressReady ? displayMinted.toLocaleString() : "…"}
              </span>
              <span className="text-[var(--ink-mute)]"> / {authorized.toLocaleString()}</span>
              <span className="hidden sm:inline">
                {" "}
                · slots {openCapacity.toLocaleString()}
                {supply?.pending ? ` · pending ${supply.pending}` : ""}
              </span>
            </p>
            <label className="byline" htmlFor="mint-qty">Amount</label>
            <div className="flex flex-wrap items-end gap-3">
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
                className="font-display w-24 border border-[var(--ink)] bg-transparent px-2 py-1.5 text-2xl tracking-tight outline-none sm:w-28 sm:text-3xl"
              />
              <span className="pb-1 font-sans text-sm text-[var(--ink-mute)]">SATDUST</span>
              {walletBalance !== null && account && (
                <span className="pb-1 font-sans text-xs text-[var(--valid)] sm:text-sm">
                  Balance {walletBalance.toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-1 border-t border-[var(--ink)]/25 pt-2 font-sans text-[0.7rem] leading-snug text-[var(--ink-mute)] sm:text-xs">
              {quote ? (
                <p className="text-[var(--ink-soft)]">
                  Pay{" "}
                  <span className="font-medium text-[var(--ink)]">
                    ≈ {totalSats.toLocaleString()} sats · ${Number(quote.usd).toFixed(2)} ·{" "}
                    {totalBtc.toFixed(8)} BTC
                  </span>
                  {" "}
                  (all-in, {unitPaySats.toLocaleString()}/ea = {UNIT_SATS} carrier +{" "}
                  {unitProjectFeeSats.toLocaleString()} fee)
                </p>
              ) : (
                <p>Loading price…</p>
              )}
            </div>

            <WalletConnect
              headlessUntilConnected
              onAccount={(acc, ad) => {
                setAccount(acc);
                setAdapter(ad);
              }}
              registerOpen={(open) => {
                walletOpenRef.current = open;
              }}
            />

            <div className="btn-row flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center">
              <button
                type="button"
                className="btn btn-solid w-full sm:w-auto"
                disabled={busy || quoteExpired}
                onClick={requestMint}
              >
                {account ? `Pay & Mint ${qty}` : "Connect & Mint"}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full sm:w-auto"
                onClick={() => void refreshQuote()}
              >
                Refresh
              </button>
            </div>
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

        </div>

        <aside className="panel-edit h-fit hidden lg:block">
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Genesis {GENESIS_SUPPLY.toLocaleString()} SATDUST. Per-wallet mint has no cap in this
            window — enter any quantity above.
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
                Mint ${quote ? Number(quote.usd).toFixed(2) : "…"} ≈ {totalSats.toLocaleString()}{" "}
                sats ({unitPaySats.toLocaleString()}/token all-in)
              </li>
              <li className="font-display text-lg text-[var(--accent)]">
                Pay {totalBtc.toFixed(8)} BTC ({totalSats.toLocaleString()} sats)
              </li>
            </ul>
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

