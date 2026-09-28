"use client";

import { useEffect, useState } from "react";
import { PROJECT_ADDRESS } from "@satdust/shared";

type Supply = {
  minted: number;
  pending: number;
  remaining: number;
  totalSupply: number;
};

export default function AdminPage() {
  const [supply, setSupply] = useState<Supply | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/supply").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]).then(([s, c]) => {
      setSupply(s);
      setConfig(c);
    });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <p className="section-num">§ Admin · Monitor only</p>
      <h1 className="font-display mt-2 text-4xl">Operations</h1>
      <p className="mt-3 text-[var(--ink-dim)]">
        No private keys are stored. This surface is observational.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Confirmed mint" value={String(supply?.minted ?? "—")} />
        <Tile label="Pending mint" value={String(supply?.pending ?? "—")} />
        <Tile label="Remaining supply" value={String(supply?.remaining ?? "—")} />
        <Tile label="Project address" value={`${PROJECT_ADDRESS.slice(0, 12)}…`} />
        <Tile
          label="Deploy tx"
          value={
            typeof config?.deployTxid === "string" && config.deployTxid
              ? `${String(config.deployTxid).slice(0, 12)}…`
              : "unset"
          }
        />
        <Tile label="Mint open" value={config?.mintOpen ? "yes" : "no"} />
      </div>

      <p className="mt-10 font-mono text-[0.75rem] text-[var(--ink-faint)]">
        Wire Bitcoin node height, indexer lag, oracle health, and revenue aggregates when
        infrastructure endpoints are connected.
      </p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-1)] p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
        {label}
      </p>
      <p className="font-mono mt-2 text-lg text-[var(--ink)] break-all">{value}</p>
    </div>
  );
}
