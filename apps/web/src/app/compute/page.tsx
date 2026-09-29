"use client";

import { useState } from "react";
import { ModuleShell } from "@/components/ModuleShell";

export default function ComputePage() {
  const [hashrate, setHashrate] = useState("");
  const [collateral, setCollateral] = useState("");

  return (
    <ModuleShell
      code="Compute"
      title="Compute"
      deck="Commit compute / hashrate credits against SATDUST collateral. Settlements settle to carrier-aware UTXOs after launch."
    >
      <div className="panel-edit space-y-4">
        <p className="kicker">Compute desk</p>
        <label className="block">
          <span className="byline">Commit hashrate (TH/s)</span>
          <input
            className="input mt-2"
            inputMode="decimal"
            placeholder="0"
            value={hashrate}
            onChange={(e) => setHashrate(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </label>
        <label className="block">
          <span className="byline">Collateral (SATDUST)</span>
          <input
            className="input mt-2"
            inputMode="decimal"
            placeholder="0"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </label>
        <dl className="grid gap-2 font-sans text-sm sm:grid-cols-2">
          <Row label="Epoch" value="—" />
          <Row label="Bond factor" value="TBD" />
          <Row label="Slashing" value="Off until launch" />
          <Row label="Payout asset" value="SATDUST / BTC" />
        </dl>
        <button type="button" className="btn btn-solid" disabled>
          Commit compute — pre-launch
        </button>
      </div>
    </ModuleShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[rgba(17,17,17,0.08)] py-1.5">
      <dt className="text-[var(--ink-mute)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
