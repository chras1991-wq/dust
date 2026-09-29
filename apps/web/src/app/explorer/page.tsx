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
      <span className="sticker sticker-cyan" style={{ ["--rot" as string]: "-3deg" }}>
        EXPLORER RADAR
      </span>
      <h1 className="hero-title mt-4 text-6xl sm:text-7xl">SCAN</h1>
      <p className="mt-3 font-stamp uppercase text-[var(--c-yellow)]">
        Mint Sequence ≠ Token ID · fungible noise only
      </p>

      {data && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Minted" value={`${data.supply.minted} / ${data.supply.totalSupply}`} color="var(--c-orange)" />
          <Stat label="Remaining" value={String(data.supply.remaining)} color="var(--c-lime)" />
          <Stat label="Pending" value={String(data.supply.pending)} color="var(--c-magenta)" />
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
                  Empty radar. After mainnet deploy + reveals, rows land here from confirmed tx +
                  indexer.
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

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel-chaos">
      <p className="font-stamp text-[0.7rem]" style={{ color }}>
        {label}
      </p>
      <p className="font-display mt-2 text-2xl font-extrabold text-[var(--c-cream)]">{value}</p>
    </div>
  );
}
