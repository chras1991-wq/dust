"use client";

import { useState } from "react";
import { ModuleShell } from "@/components/ModuleShell";

export default function StakePage() {
  const [amount, setAmount] = useState("");

  return (
    <ModuleShell
      code="Stake"
      title="Stake"
      deck="Lock SATDUST liquidity UTXOs for protocol weight. Rewards and unbonding rules activate after official launch."
    >
      <div className="panel-edit space-y-4">
        <p className="kicker">Stake desk</p>
        <label className="block">
          <span className="byline">Amount (SATDUST)</span>
          <input
            className="input mt-2"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </label>
        <dl className="grid gap-2 font-sans text-sm sm:grid-cols-2">
          <Row label="Min lock" value="7 days" />
          <Row label="Est. APR" value="— (pre-launch)" />
          <Row label="Your staked" value="0 SATDUST" />
          <Row label="Carrier intact" value="Required" />
        </dl>
        <button type="button" className="btn btn-solid" disabled>
          Stake unavailable
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
