"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeatureEntry } from "@/components/PrelaunchNotice";
import { SwapDesk } from "@/components/SwapDesk";
import { useSmoothMintProgress } from "@/hooks/useSmoothMintProgress";
import { GENESIS_SUPPLY } from "@satdust/shared";

type ActivityItem = {
  mintSequence: number;
  txid: string | null;
  inscriptionId: string | null;
  owner: string;
  amount: number;
  carrierSats: number;
  block: number | null;
  status: string;
  createdAt?: number;
};

type Payload = {
  supply: {
    totalSupply: number;
    minted: number;
    remaining: number;
    pending: number;
  };
  displayMinted?: number;
  authorized?: number;
  deployTxid: string | null;
  activity: ActivityItem[];
};

const FEATURES = [
  {
    href: "/stake",
    code: "01 · Stake",
    title: "Stake",
    blurb: "Lock SATDUST for weight and rewards. Migrates with first mint.",
  },
  {
    href: "/agent",
    code: "02 · Agent",
    title: "Agent",
    blurb: "Agents that watch or act on your SATDUST UTXOs. Migrates with first mint.",
  },
  {
    href: "/compute",
    code: "03 · Compute",
    title: "Compute",
    blurb: "Commit hashrate against SATDUST collateral. Migrates with first mint.",
  },
  {
    href: "/auction",
    code: "04 · Auction",
    title: "Auction",
    blurb: "Bid on UTXO lots, whitelist seats, and mint batches. Migrates with first mint.",
  },
];

export default function ExplorerPage() {
  const [data, setData] = useState<Payload | null>(null);
  const { liveMinted, authorized, progressReady } = useSmoothMintProgress();
  const minted =
    progressReady && liveMinted != null
      ? liveMinted
      : typeof data?.displayMinted === "number"
        ? data.displayMinted
        : null;
  const cap = authorized ?? data?.authorized ?? GENESIS_SUPPLY;

  useEffect(() => {
    void fetch("/api/activity")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="page-shell max-w-5xl py-10 sm:py-14">
      <p className="byline">Index · Markets &amp; modules</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Index</h1>
      <p className="deck mt-3 max-w-2xl text-[0.95rem] sm:mt-4 sm:text-[1.05rem]">
        Swap SATDUST ⇄ BTC, then stake, agent, compute, auction. Swap migrates when the first mint
        batch completes.
      </p>

      <div className="stat-strip mt-8 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Minted"
          value={minted != null ? `${minted.toLocaleString()} / ${cap.toLocaleString()}` : "…"}
        />
        <Stat label="Pool" value="Migrating" />
        <Stat label="Modules" value="4 desks" />
      </div>

      <div className="mt-10">
        <SwapDesk />
      </div>

      <section className="mt-12">
        <p className="byline">Modules</p>
        <h2 className="font-display mt-2 text-3xl sm:text-4xl">Modules</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-mute)]">
          Each opens a full desk. Execution migrates when the first mint batch completes.
        </p>
        <div className="feature-grid mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {FEATURES.map((f) => (
            <FeatureEntry key={f.href} {...f} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="byline">Ledger</p>
            <h2 className="font-display mt-1 text-2xl sm:text-3xl">Mint activity</h2>
            <p className="mt-1 font-sans text-sm text-[var(--ink-mute)]">
              {minted != null
                ? `${minted.toLocaleString()} / ${cap.toLocaleString()} · same count as the mint desk`
                : "…"}
            </p>
          </div>
          <Link href="/verify" className="font-condensed text-[0.75rem] uppercase tracking-[0.12em]">
            Prove a tx →
          </Link>
        </div>
        <div className="scroll-x mt-5">
          <table className="table-spec min-w-[720px]">
            <thead>
              <tr>
                <th>When</th>
                <th>TXID</th>
                <th>Owner</th>
                <th>Amount</th>
                <th>UTXO sats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <tr>
                  <td colSpan={6} className="text-[var(--ink-mute)]">
                    …
                  </td>
                </tr>
              ) : data.activity.length ? (
                data.activity.map((row) => (
                  <tr key={`${row.mintSequence}-${row.txid}`}>
                    <td>{row.createdAt ? formatWhen(row.createdAt) : "—"}</td>
                    <td>
                      {row.txid ? (
                        <Link href={`/verify?txid=${row.txid}`}>{row.txid.slice(0, 8)}…</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="font-mono text-xs">{row.owner || "—"}</td>
                    <td>{row.amount} SATDUST</td>
                    <td>{row.carrierSats} sats</td>
                    <td className={row.status.includes("VALID") ? "status-confirmed" : "status-pending"}>
                      {activityStatus(row.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-[var(--ink-mute)]">
                    {minted != null
                      ? `Mint progress is ${minted.toLocaleString()} / ${cap.toLocaleString()}. Paid transfers list here.`
                      : "…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatWhen(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}-${day} ${h}:${min}`;
}

function activityStatus(status: string): string {
  if (status.includes("VALID") || status.includes("CONFIRMED")) return "Counted";
  if (status.includes("BROADCAST") || status.includes("MEMPOOL") || status.includes("PENDING")) {
    return "Paid";
  }
  return "Paid";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-edit">
      <p className="byline">{label}</p>
      <p className="font-display mt-2 text-2xl sm:text-3xl">{value}</p>
    </div>
  );
}
