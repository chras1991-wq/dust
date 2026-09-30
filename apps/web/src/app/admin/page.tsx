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
    <div className="page-shell max-w-4xl py-10 sm:py-14">
      <p className="byline">Back office · Monitor</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Admin</h1>
      <p className="deck mt-3">Observational only. Zero private keys.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Confirmed mint" value={String(supply?.minted ?? "—")} />
        <Tile label="Pending mint" value={String(supply?.pending ?? "—")} />
        <Tile label="Remaining" value={String(supply?.remaining ?? "—")} />
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
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-edit">
      <p className="byline">{label}</p>
      <p className="font-display mt-2 break-all text-2xl">{value}</p>
    </div>
  );
}
