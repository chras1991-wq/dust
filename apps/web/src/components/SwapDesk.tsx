"use client";

import { useMemo, useState } from "react";
import { UNIT_SATS } from "@satdust/shared";

type Side = "SATDUST" | "BTC";

/** Placeholder rate until markets exist: 1 SATDUST ≈ carrier sats in BTC terms for UI only. */
const PLACEHOLDER_SATDUST_PER_BTC = 1 / (UNIT_SATS / 1e8);

export function SwapDesk() {
  const [paySide, setPaySide] = useState<Side>("BTC");
  const [payAmount, setPayAmount] = useState("");
  const receiveSide: Side = paySide === "BTC" ? "SATDUST" : "BTC";

  const receiveAmount = useMemo(() => {
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (paySide === "BTC") return (n * PLACEHOLDER_SATDUST_PER_BTC).toFixed(4);
    return (n / PLACEHOLDER_SATDUST_PER_BTC).toFixed(8);
  }, [payAmount, paySide]);

  function flip() {
    setPaySide(receiveSide);
    setPayAmount(receiveAmount);
  }

  return (
    <div className="panel-edit swap-desk">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="kicker">Swap</p>
          <h2 className="font-display mt-1 text-[1.75rem] leading-none sm:text-4xl">
            SATDUST ⇄ BTC
          </h2>
        </div>
        <span className="pill-tag w-fit">Pre-launch · Quote only</span>
      </div>
      <p className="mt-3 max-w-xl text-sm text-[var(--ink-mute)]">
        Bidirectional conversion against liquidity UTXO carriers. Execution unlocks after official
        launch and pool bootstrap.
      </p>

      <div className="mt-6 space-y-3">
        <SwapLeg
          label="You pay"
          side={paySide}
          amount={payAmount}
          onAmount={setPayAmount}
          onSide={setPaySide}
          editable
        />

        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-ghost swap-flip min-h-12 sm:!w-auto sm:px-6"
            onClick={flip}
            aria-label="Flip swap direction"
          >
            ⇅ Flip
          </button>
        </div>

        <SwapLeg
          label="You receive"
          side={receiveSide}
          amount={receiveAmount}
          onAmount={() => undefined}
          onSide={() => undefined}
          editable={false}
        />
      </div>

      <dl className="mt-5 grid gap-2 font-sans text-sm sm:grid-cols-2">
        <Meta label="Route" value="Liquidity UTXO pool" />
        <Meta label="Slippage" value="0.50% (default)" />
        <Meta label="Network" value="Bitcoin mainnet" />
        <Meta label="Status" value="Markets offline" accent />
      </dl>

      <button type="button" className="btn btn-solid mt-6" disabled>
        Swap unavailable — pre-launch
      </button>
      <p className="mt-2 break-words font-mono text-xs text-[var(--ink-mute)]">
        Placeholder rate uses carrier sats for display only. Not an offer.
      </p>
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
