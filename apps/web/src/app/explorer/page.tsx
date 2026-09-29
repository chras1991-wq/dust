"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeatureEntry } from "@/components/PrelaunchNotice";
import { SwapDesk } from "@/components/SwapDesk";

type ActivityItem = {
  mintSequence: number;
  txid: string | null;
  inscriptionId: string | null;
  owner: string;
  amount: number;
  carrierSats: number;
  block: number | null;
  status: string;
};

type Payload = {
  supply: {
    totalSupply: number;
    minted: number;
    remaining: number;
    pending: number;
  };
  deployTxid: string | null;
  activity: ActivityItem[];
};

const FEATURES = [
  {
    href: "/stake",
    code: "01 · Stake",
    title: "Stake",
    blurb: "Lock SATDUST for weight and rewards after launch.",
  },
  {
    href: "/agent",
    code: "02 · Agent",
    title: "Agent",
    blurb: "Agents that watch or act on your SATDUST UTXOs.",
  },
  {
    href: "/compute",
    code: "03 · Compute",
    title: "Compute",
    blurb: "Commit hashrate against SATDUST collateral.",
  },
  {
    href: "/auction",
    code: "04 · Auction",
    title: "Auction",
    blurb: "Bid on UTXO lots, whitelist seats, and mint batches.",
  },
];

export default function ExplorerPage() {
  const [data, setData] = useState<Payload | null>(null);

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
          value={data ? `${data.supply.minted.toLocaleString()} / ${data.supply.totalSupply.toLocaleString()}` : "—"}
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
          Each opens a full desk. Actions stay off until launch.
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
          </div>
          <Link href="/verify" className="font-condensed text-[0.75rem] uppercase tracking-[0.12em]">
            Prove a tx →
          </Link>
        </div>
        <div className="scroll-x mt-5">
          <table className="table-spec min-w-[720px]">
            <thead>
              <tr>
                <th>Mint #</th>
                <th>TXID</th>
                <th>Owner</th>
                <th>Amount</th>
                <th>UTXO sats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.activity.length ? (
                data.activity.map((row) => (
                  <tr key={`${row.mintSequence}-${row.txid}`}>
                    <td>{String(row.mintSequence).padStart(6, "0")}</td>
                    <td>
                      {row.txid ? (
                        <Link href={`/verify?txid=${row.txid}`}>{row.txid.slice(0, 8)}…</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {row.owner.slice(0, 8)}…{row.owner.slice(-4)}
                    </td>
                    <td>{row.amount} SATDUST</td>
                    <td>{row.carrierSats} sats</td>
                    <td
                      className={
                        row.status.includes("VALID") || row.status.includes("CONFIRMED")
                          ? "status-confirmed"
                          : "status-pending"
                      }
                    >
                      {row.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-[var(--ink-mute)]">
                    No indexed mints yet. Rows appear after confirmation + indexer acceptance.
                    {data?.deployTxid
                      ? ` Deploy: ${data.deployTxid.slice(0, 16)}…`
                      : " Deploy not recorded."}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-edit">
      <p className="byline">{label}</p>
      <p className="font-display mt-2 text-2xl sm:text-3xl">{value}</p>
    </div>
  );
}
