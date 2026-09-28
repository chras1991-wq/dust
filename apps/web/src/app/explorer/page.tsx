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
    <div className="mx-auto max-w-5xl px-5 py-14">
      <p className="section-num">§ Explorer</p>
      <h1 className="font-display mt-2 text-5xl">SATDUST</h1>
      <p className="mt-3 text-[var(--ink-dim)]">
        Mint sequence is an ordering convenience for fungible units — not a Token ID.
      </p>

      {data && (
        <div className="mt-10 grid gap-6 border border-[var(--rule)] bg-[var(--bg-1)] p-5 sm:grid-cols-3">
          <Stat label="Minted" value={`${data.supply.minted.toLocaleString()} / ${data.supply.totalSupply.toLocaleString()}`} />
          <Stat label="Remaining" value={data.supply.remaining.toLocaleString()} />
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
                      <Link href={`/verify?txid=${row.txid}`}>
                        {row.txid.slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-[var(--ink-dim)]">
                    {row.inscriptionId ? `${row.inscriptionId.slice(0, 10)}…` : "—"}
                  </td>
                  <td className="text-[var(--ink-dim)]">
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
                  No indexed mints yet. After mainnet deploy and first reveals, rows appear
                  here from confirmed tx + DUST-20 indexer results.
                  {data?.deployTxid
                    ? ` Deploy tx: ${data.deployTxid.slice(0, 16)}…`
                    : " Deploy not yet recorded."}
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
    <div>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
        {label}
      </p>
      <p className="font-mono mt-1 text-xl text-[var(--ink)]">{value}</p>
    </div>
  );
}
