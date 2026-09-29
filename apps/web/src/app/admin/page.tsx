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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <span className="sticker sticker-orange">OPS DECK</span>
      <h1 className="hero-title mt-4 text-5xl">ADMIN</h1>
      <p className="mt-3 text-[var(--ink-dim)]">Monitor only. Zero private keys.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Tile label="Mint open" value={config?.mintOpen ? "YES" : "NO"} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-chaos">
      <p className="font-stamp text-[0.65rem] text-[var(--c-yellow)]">{label}</p>
      <p className="font-display mt-2 text-xl font-extrabold break-all text-[var(--c-cream)]">
        {value}
      </p>
    </div>
  );
}
