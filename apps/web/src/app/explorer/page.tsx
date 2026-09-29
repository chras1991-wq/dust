"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function ExplorerPage() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    void fetch("/api/activity")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <span className="pill pill-cyan">explorer radar</span>
      <h1 className="hologram-text hero-title mt-4 text-6xl sm:text-7xl">SCAN</h1>
      <p className="mt-3 font-mono text-xl text-[var(--pink)]">
        Mint Sequence ≠ Token ID · fungible only
      </p>

      {data && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Minted" value={`${data.supply.minted} / ${data.supply.totalSupply}`} />
          <Stat label="Remaining" value={String(data.supply.remaining)} />
          <Stat label="Pending" value={String(data.supply.pending)} />
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="table-spec min-w-[720px]">
          <thead>
            <tr>
              <th>Mint #</th>
              <th>TXID</th>
              <th>Inscription</th>
              <th>Owner</th>
              <th>Amount</th>
              <th>Carrier</th>
              <th>Block</th>
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
                  <td>{row.inscriptionId ? `${row.inscriptionId.slice(0, 10)}…` : "—"}</td>
                  <td>
                    {row.owner.slice(0, 8)}…{row.owner.slice(-4)}
                  </td>
                  <td>{row.amount} SATDUST</td>
                  <td>{row.carrierSats} sats</td>
                  <td>{row.block ?? "—"}</td>
                  <td
                    className={
                      row.status.includes("VALID") || row.status.includes("CONFIRMED")
                        ? "status-confirmed"
                        : row.status.includes("INVALID")
                          ? "status-invalid"
                          : "status-pending"
                    }
                  >
                    {row.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-[var(--ink-dim)]">
                  Empty radar. After mainnet deploy + reveals, rows land here.
                  {data?.deployTxid
                    ? ` Deploy: ${data.deployTxid.slice(0, 16)}…`
                    : " Deploy not recorded."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-y2k">
      <p className="font-pixel text-[0.55rem] text-[var(--cyan)]">{label}</p>
      <p className="chrome-text mt-2 text-2xl">{value}</p>
    </div>
  );
}
