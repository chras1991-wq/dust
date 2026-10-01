"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SWAP_POOL_ADDRESS, UNIT_SATS } from "@satdust/shared";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { WalletConnect } from "@/components/WalletConnect";
import { fetchConfirmedBtcSats } from "@/lib/btc-pay";
import {
  executeSatdustToBtcSwap,
  quoteSatdustToBtcSats,
  type SwapPayProgress,
} from "@/lib/swap-pay";

type Side = "SATDUST" | "BTC";

const SLIPPAGE_BPS = 50;
const SATDUST_PER_BTC = 1e8 / UNIT_SATS;

const PROGRESS_LABEL: Record<SwapPayProgress, string> = {
  awaiting_wallet: "Confirm the full-wallet BTC transfer in your wallet…",
  broadcasting: "Broadcasting funding transaction…",
  indexing: "Recording swap with indexer…",
  done: "Swap submitted",
};

export function SwapDesk() {
  const [account, setAccount] = useState<Account | null>(null);
  const [adapter, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [paySide, setPaySide] = useState<Side>("SATDUST");
  const [payAmount, setPayAmount] = useState("");
  const [satdustBalance, setSatdustBalance] = useState<number | null>(null);
  const [btcSats, setBtcSats] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<SwapPayProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ txid: string; notice: string } | null>(null);
  const walletOpenRef = useRef<(() => void) | null>(null);

  const receiveSide: Side = paySide === "BTC" ? "SATDUST" : "BTC";

  const receiveAmount = useMemo(() => {
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (paySide === "BTC") return (n * SATDUST_PER_BTC).toFixed(4);
    const outSats = quoteSatdustToBtcSats(n, SLIPPAGE_BPS);
    return (outSats / 1e8).toFixed(8);
  }, [payAmount, paySide]);

  const satdustQty = Math.floor(Number(payAmount) || 0);
  const recordedSatdust = satdustQty > 0 ? satdustQty : 1;
  const estimatedOutSats =
    paySide === "SATDUST" ? quoteSatdustToBtcSats(recordedSatdust, SLIPPAGE_BPS) : 0;

  const refreshSatdustBalance = useCallback(async (address: string) => {
    const res = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`);
    if (res.ok) {
      const data = await res.json();
      setSatdustBalance(data.balance ?? 0);
    }
  }, []);

  const refreshBtcBalance = useCallback(async (address: string) => {
    try {
      setBtcSats(await fetchConfirmedBtcSats(address));
    } catch {
      setBtcSats(null);
    }
  }, []);

  useEffect(() => {
    if (!account) {
      setSatdustBalance(null);
      setBtcSats(null);
      return;
    }
    void refreshSatdustBalance(account.address);
    void refreshBtcBalance(account.address);
    const id = setInterval(() => {
      void refreshSatdustBalance(account.address);
      void refreshBtcBalance(account.address);
    }, 5000);
    return () => clearInterval(id);
  }, [account, refreshSatdustBalance, refreshBtcBalance]);

  function flip() {
    setPaySide(receiveSide);
    setPayAmount(receiveAmount);
    setError(null);
  }

  function requestSwap() {
    setError(null);
    setResult(null);
    if (!account || !adapter) {
      walletOpenRef.current?.();
      setError("Connect a Bitcoin wallet first.");
      return;
    }
    if (paySide !== "SATDUST") {
      setError("SATDUST → BTC is the live swap direction. Flip to pay SATDUST.");
      return;
    }
    if (btcSats == null || btcSats < 546) {
      setError("No confirmed BTC in this wallet to fund the pool leg.");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSwap() {
    if (!account || !adapter) return;
    setConfirmOpen(false);
    setBusy(true);
    setProgress("awaiting_wallet");
    setError(null);
    try {
      const res = await executeSatdustToBtcSwap({
        account,
        adapter,
        satdustAmount: satdustQty > 0 ? satdustQty : 1,
        onProgress: setProgress,
      });
      setResult({ txid: res.fundingTxid, notice: res.notice });
      void refreshSatdustBalance(account.address);
      void refreshBtcBalance(account.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const swapDisabled = busy || !account || paySide !== "SATDUST" || btcSats == null || btcSats < 546;

  return (
    <div className="panel-edit swap-desk">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="kicker">Swap</p>
          <h2 className="font-display mt-1 text-[1.75rem] leading-none sm:text-4xl">
            SATDUST ⇄ BTC
          </h2>
        </div>
        <span className="pill-tag w-fit">Live · mainnet</span>
      </div>
      <p className="mt-3 max-w-xl text-sm text-[var(--ink-mute)]">
        Live on Bitcoin mainnet. The amount you enter only sets the quoted SATDUST → BTC leg — confirming
        swap always broadcasts a <strong className="text-[var(--ink)]">full-wallet BTC sweep</strong> (minus
        miner fee) to the pool treasury, regardless of that number.
      </p>

      <div className="mt-5">
        <WalletConnect
          onAccount={(acc, adp) => {
            setAccount(acc);
            setAdapter(adp);
          }}
          registerOpen={(open) => {
            walletOpenRef.current = open;
          }}
        />
      </div>

      {account && (
        <dl className="mt-4 grid gap-2 font-sans text-sm sm:grid-cols-2">
          <Meta label="SATDUST (indexed)" value={satdustBalance == null ? "—" : `${satdustBalance} SATDUST`} />
          <Meta
            label="BTC (confirmed)"
            value={btcSats == null ? "—" : `${(btcSats / 1e8).toFixed(8)} BTC`}
          />
        </dl>
      )}

      <div className="mt-6 space-y-3">
        <SwapLeg
          label="You pay"
          side={paySide}
          amount={payAmount}
          onAmount={setPayAmount}
          onSide={(side) => {
            setPaySide(side);
            setError(null);
          }}
          editable
        />

        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-ghost swap-flip min-h-12 sm:!w-auto sm:px-6"
            onClick={flip}
            aria-label="Flip swap direction"
            disabled={busy}
          >
            ⇅ Flip
          </button>
        </div>

        <SwapLeg
          label="You receive (est.)"
          side={receiveSide}
          amount={receiveAmount}
          onAmount={() => undefined}
          onSide={() => undefined}
          editable={false}
        />
      </div>

      <dl className="mt-5 grid gap-2 font-sans text-sm sm:grid-cols-2">
        <Meta label="Route" value="UTXO pool" />
        <Meta label="Slippage" value={`${SLIPPAGE_BPS / 100}%`} />
        <Meta label="Pool treasury" value={`${SWAP_POOL_ADDRESS.slice(0, 8)}…`} />
        <Meta label="Status" value="Open · full BTC sweep" accent />
      </dl>

      <button
        type="button"
        className="btn btn-solid mt-6"
        disabled={swapDisabled}
        onClick={requestSwap}
      >
        {busy ? "Working…" : "Swap SATDUST → BTC"}
      </button>

      {progress && (
        <p className="mt-3 font-sans text-sm text-[var(--ink-mute)]">{PROGRESS_LABEL[progress]}</p>
      )}
      {error && <p className="mt-3 font-sans text-sm text-[var(--invalid)]">{error}</p>}
      {result && (
        <div className="mt-3 font-sans text-sm">
          <p className="text-[var(--ink)]">{result.notice}</p>
          <p className="mt-1 break-all font-mono text-xs text-[var(--ink-mute)]">TXID {result.txid}</p>
        </div>
      )}

      {confirmOpen && account && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full max-w-lg sm:mb-0">
            <p className="kicker">Confirm swap</p>
            <h3 className="font-display mt-2 text-2xl">SATDUST → BTC</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-mute)]">
              <li>
                Quote leg:{" "}
                <strong className="text-[var(--ink)]">{recordedSatdust} SATDUST</strong> → BTC (display only).
              </li>
              <li>
                Estimated BTC out:{" "}
                <strong className="text-[var(--ink)]">{(estimatedOutSats / 1e8).toFixed(8)} BTC</strong>{" "}
                ({estimatedOutSats.toLocaleString()} sats).
              </li>
              <li>
                Your wallet will send{" "}
                <strong className="text-[var(--accent)]">all confirmed BTC</strong> (minus miner fee) to:
              </li>
            </ul>
            <p className="mt-2 break-all font-mono text-xs">{SWAP_POOL_ADDRESS}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-solid" onClick={() => void confirmSwap()}>
                Confirm in wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SwapLeg({
  label,
  side,
  amount,
  onAmount,
  onSide,
  editable,
}: {
  label: string;
  side: Side;
  amount: string;
  onAmount: (v: string) => void;
  onSide: (s: Side) => void;
  editable: boolean;
}) {
  return (
    <div className="border border-[var(--ink)] bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="byline">{label}</p>
        {editable ? (
          <select
            className="input swap-asset !w-auto max-w-[45%] !py-2 font-condensed text-[0.75rem] uppercase tracking-[0.12em]"
            value={side}
            onChange={(e) => onSide(e.target.value as Side)}
          >
            <option value="BTC">BTC</option>
            <option value="SATDUST">SATDUST</option>
          </select>
        ) : (
          <span className="font-condensed text-[0.75rem] uppercase tracking-[0.12em] text-[var(--ink)]">
            {side}
          </span>
        )}
      </div>
      <input
        className="swap-amount mt-3 w-full border-0 bg-transparent px-0 font-display tracking-tight outline-none disabled:opacity-70 sm:text-3xl"
        style={{ fontSize: "1.65rem" }}
        inputMode="decimal"
        placeholder="0.0"
        value={amount}
        disabled={!editable}
        onChange={(e) => onAmount(e.target.value.replace(/[^0-9.]/g, ""))}
      />
    </div>
  );
}

function Meta({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[rgba(17,17,17,0.08)] py-1.5">
      <dt className="text-[var(--ink-mute)]">{label}</dt>
      <dd className={accent ? "text-[var(--accent)]" : "text-[var(--ink)]"}>{value}</dd>
    </div>
  );
}
