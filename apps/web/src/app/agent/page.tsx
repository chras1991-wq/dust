"use client";

import { useState } from "react";
import { ModuleShell } from "@/components/ModuleShell";

const AGENTS = [
  {
    id: "rebalancer",
    name: "Rebalancer",
    blurb: "Keeps carrier UTXOs within declared sats bounds across spends.",
  },
  {
    id: "whitelist",
    name: "Whitelist scout",
    blurb: "Tracks contributor eligibility for later issuance rounds.",
  },
  {
    id: "mint-watch",
    name: "Mint watch",
    blurb: "Alerts when milestone goals flip or proposals open.",
  },
];

export default function AgentPage() {
  const [selected, setSelected] = useState(AGENTS[0].id);

  return (
    <ModuleShell
      code="Agent"
      title="Agent"
      deck="Delegate bounded agents that watch or act on your SATDUST carriers. No private keys leave the wallet — agents request PSBT signatures only."
    >
      <ul className="space-y-3">
        {AGENTS.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setSelected(a.id)}
              className={`flex w-full flex-col border px-4 py-4 text-left transition-colors ${
                selected === a.id
                  ? "border-[var(--accent)] bg-white"
                  : "border-[var(--ink)] bg-transparent hover:border-[var(--accent)]"
              }`}
            >
              <span className="font-display text-xl">{a.name}</span>
              <span className="mt-1 text-sm text-[var(--ink-mute)]">{a.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-solid mt-6" disabled>
        Deploy agent — pre-launch
      </button>
    </ModuleShell>
  );
}
