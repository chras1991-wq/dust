"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useDeskWallet } from "@/hooks/useDeskWallet";

const LOCKS = [
  { days: 7, weight: 1, note: "Base weight" },
  { days: 30, weight: 1.35, note: "Longer lock" },
  { days: 90, weight: 1.8, note: "Full weight" },
] as const;

type LockDays = (typeof LOCKS)[number]["days"];

type StakePosition = {
  id: string;
  amount: number;
  days: LockDays;
  weight: number;
  createdAt: number;
  unlockAt: number;
};

export default function StakePage() {
  const { account, setAccount, balance, btcSats, openWallet, registerOpen } = useDeskWallet();
  const [amountInput, setAmountInput] = useState("10");
  const [days, setDays] = useState<LockDays>(30);
  const [review, setReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<StakePosition[]>([]);

  const lock = LOCKS.find((row) => row.days === days) ?? LOCKS[1];
  const amount = Math.floor(Number(amountInput));
  const amountOk = Number.isFinite(amount) && amount >= 1;
  const weight = amountOk ? Math.round(amount * lock.weight * 100) / 100 : 0;
  const unlockAt = useMemo(() => Date.now() + lock.days * 86_400_000, [lock.days]);

  useEffect(() => {
    setPositions(readPositions(account?.address));
    setReview(false);
    setError(null);
  }, [account?.address]);

  function requestStake() {
    setError(null);
    if (!account) {
      openWallet();
      return;
    }
    if (!amountOk) {
      setError("Enter at least 1 SATDUST.");
      return;
    }
    if (balance != null && amount > balance) {
      setError(`This wallet holds ${balance.toLocaleString()} SATDUST.`);
      return;
    }
    setReview(true);
  }

  function confirmStake() {
    if (!account || !amountOk) return;
    const next: StakePosition = {
      id: `${Date.now().toString(36)}-${amount}`,
      amount,
      days: lock.days,
      weight,
      createdAt: Date.now(),
      unlockAt: Date.now() + lock.days * 86_400_000,
    };
    const saved = [next, ...readPositions(account.address)];
    writePositions(account.address, saved);
    setPositions(saved);
    setReview(false);
    setAmountInput("10");
  }

  const staked = positions.reduce((sum, row) => sum + row.amount, 0);
  const weightSum = positions.reduce((sum, row) => sum + row.weight, 0);

  return (
    <div className="page-shell max-w-5xl py-10 sm:py-14">
      <p className="byline">
        <Link href="/explorer" className="no-underline hover:text-[var(--accent)]">
          Index
        </Link>{" "}
        · 01 · Stake desk
      </p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl">Stake</h1>
      <p className="deck mt-3 max-w-2xl text-[0.95rem] sm:mt-4 sm:text-[1.05rem]">
        Lock SATDUST for vote weight. A longer lock counts more. The carrier UTXO stays intact.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
        <div>
          <div className="panel-edit space-y-4">
            <p className="font-sans text-xs text-[var(--ink-mute)] sm:text-sm">
              Your stake{" "}
              <span className="font-display text-lg text-[var(--ink)] tabular-nums">
                {staked.toLocaleString()}
              </span>
              <span className="text-[var(--ink-mute)]"> SATDUST</span>
              <span className="hidden sm:inline"> · weight {formatWeight(weightSum)}</span>
            </p>

            <div className="flex items-end justify-between gap-3">
              <label className="byline" htmlFor="stake-amount">
                Amount
              </label>
              {account && (
                <button
                  type="button"
                  className="font-sans text-xs text-[var(--accent)] underline-offset-2 hover:underline"
                  onClick={() => {
                    if (balance != null && balance > 0) setAmountInput(String(balance));
                  }}
                >
                  {balance == null ? "Balance …" : `Balance ${balance.toLocaleString()}`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <input
                id="stake-amount"
                className="font-display w-28 border border-[var(--ink)] bg-transparent px-2 py-1.5 text-2xl tracking-tight outline-none sm:w-36 sm:text-3xl"
                inputMode="numeric"
                autoComplete="off"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ""))}
              />
              <span className="pb-1 font-sans text-sm text-[var(--ink-mute)]">SATDUST</span>
            </div>

            <div>
              <p className="byline">Lock</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {LOCKS.map((row) => {
                  const on = row.days === days;
                  return (
                    <button
                      key={row.days}
                      type="button"
                      onClick={() => setDays(row.days)}
                      className={`border px-2 py-3 text-left ${
                        on
                          ? "border-[var(--accent)] bg-white"
                          : "border-[var(--ink)] bg-transparent hover:border-[var(--accent)]"
                      }`}
                    >
                      <span className="block font-display text-lg leading-none sm:text-xl">
                        {row.days}d
                      </span>
                      <span className="mt-1 block font-sans text-[0.7rem] text-[var(--ink-mute)]">
                        {row.weight.toFixed(2)}×
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <dl className="space-y-0 border-t border-[var(--ink)]/25 pt-3 font-sans text-sm">
              <Field label="Weight" value={amountOk ? formatWeight(weight) : "—"} />
              <Field label="Unlocks" value={formatWhen(unlockAt)} />
              <Field label="UTXO" value="Stays intact" />
              <Field label="Unstake" value="After the lock" />
            </dl>

            <WalletConnect
              headlessUntilConnected
              balanceText={account ? formatBtc(btcSats) : null}
              onAccount={(acc) => setAccount(acc)}
              registerOpen={registerOpen}
            />

            <button type="button" className="btn btn-solid w-full sm:w-auto" onClick={requestStake}>
              {account ? "Review stake" : "Connect & stake"}
            </button>
          </div>

          {error && <p className="mt-4 font-sans text-sm text-[var(--invalid)]">{error}</p>}

          {review && account && amountOk && (
            <div className="panel-edit mt-4 space-y-3 border-[var(--accent)]">
              <p className="kicker">Confirm lock</p>
              <p className="font-display text-3xl">
                {amount.toLocaleString()}{" "}
                <span className="font-sans text-base text-[var(--ink-mute)]">SATDUST</span>
              </p>
              <p className="font-sans text-sm text-[var(--ink-soft)]">
                {lock.days} days · weight {formatWeight(weight)} · unlocks {formatWhen(unlockAt)}.
                The position is saved on this desk for {shortAddress(account.address)}. Broadcast
                opens when the stake module migrates; the coins stay in the wallet until then.
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn-solid" onClick={confirmStake}>
                  Stake {amount.toLocaleString()}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setReview(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <section className="mt-8">
            <p className="byline">Positions</p>
            {positions.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-[var(--ink-mute)]">
                {account ? "No stake on this desk yet." : "Connect a wallet to see its stake."}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-[var(--ink)]/15 border-t border-[var(--ink)]/20 font-sans text-sm">
                {positions.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                    <span className="text-[var(--ink)]">
                      {row.amount.toLocaleString()} SATDUST
                      <span className="text-[var(--ink-mute)]"> · {row.days}d</span>
                    </span>
                    <span className="text-right text-xs text-[var(--ink-mute)]">
                      weight {formatWeight(row.weight)} · unlocks {formatWhen(row.unlockAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="panel-edit space-y-4">
          <p className="kicker">Rules</p>
          <h2 className="font-display text-3xl">Weight, not a second token</h2>
          <ul className="space-y-3 font-sans text-sm text-[var(--ink-soft)]">
            <li>7 days counts 1.00×. 30 days counts 1.35×. 90 days counts 1.80×.</li>
            <li>The 546-sat carrier UTXO is not split. Staking does not move the inscription.</li>
            <li>Weight is what later milestone votes and stake gates read.</li>
            <li>You can release a position only after its unlock time.</li>
          </ul>
          <p className="font-sans text-sm text-[var(--ink-mute)]">
            Need SATDUST first? <Link href="/mint">Mint desk</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[rgba(17,17,17,0.08)] py-1.5">
      <dt className="text-[var(--ink-mute)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatWeight(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatWhen(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatBtc(sats: number | null): string {
  if (sats == null) return "BTC …";
  return `${(sats / 100_000_000).toFixed(8)} BTC`;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function storageKey(address: string): string {
  return `satdust:stake:v1:${address.toLowerCase()}`;
}

function readPositions(address: string | undefined): StakePosition[] {
  if (!address || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    const parsed = raw ? (JSON.parse(raw) as StakePosition[]) : [];
    return Array.isArray(parsed) ? parsed.filter((row) => row && row.amount > 0) : [];
  } catch {
    return [];
  }
}

function writePositions(address: string, rows: StakePosition[]) {
  window.localStorage.setItem(storageKey(address), JSON.stringify(rows.slice(0, 40)));
}
