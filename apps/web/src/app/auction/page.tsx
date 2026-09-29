"use client";

import { useState } from "react";
import { ModuleShell } from "@/components/ModuleShell";

const LOTS = [
  {
    id: "lot-a",
    title: "Genesis residual lot",
    detail: "Unfilled Genesis capacity slices — opens after launch.",
    status: "Scheduled",
  },
  {
    id: "lot-b",
    title: "Contributor whitelist seat",
    detail: "Priority mint access for later milestone rounds.",
    status: "Queued",
  },
  {
    id: "lot-c",
    title: "Carrier bundle",
    detail: "Packaged liquidity UTXO lots for market makers.",
    status: "Queued",
  },
];

export default function AuctionPage() {
  const [bid, setBid] = useState("");
  const [lot, setLot] = useState(LOTS[0].id);

  return (
    <ModuleShell
      code="Auction"
      title="Auction"
      deck="Bid on carrier lots, whitelist seats, and milestone capacity. Clearing is English-style until governance sets otherwise."
    >
      <ul className="space-y-3">
        {LOTS.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => setLot(l.id)}
              className={`w-full border px-4 py-4 text-left ${
                lot === l.id ? "border-[var(--accent)] bg-white" : "border-[var(--ink)]"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-xl">{l.title}</span>
                <span className="status-pending">{l.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">{l.detail}</p>
            </button>
          </li>
        ))}
      </ul>
      <div className="panel-edit mt-6 space-y-4">
        <label className="block">
          <span className="byline">Bid (BTC)</span>
          <input
            className="input mt-2"
            inputMode="decimal"
            placeholder="0.0"
            value={bid}
            onChange={(e) => setBid(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </label>
        <button type="button" className="btn btn-solid" disabled>
          Place bid — pre-launch
        </button>
      </div>
    </ModuleShell>
  );
}
