"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UNIT_SATS } from "@satdust/shared";

export default function CreatePage() {
  const [tick, setTick] = useState("");
  const [supply, setSupply] = useState("54600");
  const [unitSats, setUnitSats] = useState(String(UNIT_SATS));
  const [limSats, setLimSats] = useState(String(UNIT_SATS));
  const [blurb, setBlurb] = useState("");

  const maxSats = useMemo(() => {
    const s = Number(supply);
    const u = Number(unitSats);
    if (!Number.isFinite(s) || !Number.isFinite(u)) return 0;
    return s * u;
  }, [supply, unitSats]);

  const tickNorm = tick.trim().toUpperCase();
  const validTick = /^[A-Z0-9]{2,12}$/.test(tickNorm);
  const validNums =
    Number(supply) > 0 &&
    Number(unitSats) >= 546 &&
    Number(limSats) > 0 &&
    Number(limSats) <= Number(unitSats) * Number(supply);
  const canPreview = validTick && validNums;

  const deployJson = {
    p: "dust-20",
    op: "deploy",
    tick: tickNorm || "TICKER",
    supply: String(Number(supply) || 0),
    unit_sats: String(Number(unitSats) || 0),
    max_sats: String(maxSats),
    lim_sats: String(Number(limSats) || 0),
  };

  return (
    <div className="page-shell max-w-4xl py-10 sm:py-14">
      <p className="byline">Create · Deploy</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Create</h1>
      <p className="deck mt-3 max-w-2xl text-[0.95rem] sm:mt-4 sm:text-[1.05rem]">
        Deploy your own DUST-20 ticker on mainnet — same rules as SATDUST: exact sats, offset 0,
        case-insensitive ticker.
      </p>

      <div className="mt-4 panel-edit border-[var(--accent)]">
        <p className="kicker">Pending migration</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Broadcast migrates when the first mint batch completes. You can draft the deploy JSON and
          check the numbers now.
        </p>
      </div>

      <div className="create-grid mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.95fr]">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label className="block">
            <span className="byline">Ticker</span>
            <input
              className="input mt-2 uppercase"
              placeholder="e.g. ORBIT"
              maxLength={12}
              value={tick}
              onChange={(e) => setTick(e.target.value.toUpperCase())}
            />
            <span className="mt-1 block font-mono text-xs text-[var(--ink-mute)]">
              2–12 chars · A–Z / 0–9 · case-folded on-chain
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="byline">Supply</span>
              <input
                className="input mt-2"
                inputMode="numeric"
                value={supply}
                onChange={(e) => setSupply(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="block">
              <span className="byline">unit_sats</span>
              <input
                className="input mt-2"
                inputMode="numeric"
                value={unitSats}
                onChange={(e) => setUnitSats(e.target.value.replace(/\D/g, ""))}
              />
              <span className="mt-1 block font-mono text-xs text-[var(--ink-mute)]">
                Sats per SATDUST (≥ 546)
              </span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="byline">max_sats (computed)</span>
              <input className="input mt-2" value={maxSats.toLocaleString()} readOnly />
              <span className="mt-1 block font-mono text-xs text-[var(--ink-mute)]">
                supply × unit_sats
              </span>
            </label>
            <label className="block">
              <span className="byline">lim_sats</span>
              <input
                className="input mt-2"
                inputMode="numeric"
                value={limSats}
                onChange={(e) => setLimSats(e.target.value.replace(/\D/g, ""))}
              />
              <span className="mt-1 block font-mono text-xs text-[var(--ink-mute)]">
                Per-tx mint sats ceiling
              </span>
            </label>
          </div>

          <label className="block">
            <span className="byline">Short description (off-chain)</span>
            <textarea
              className="input mt-2 min-h-24 font-sans"
              placeholder="What this ticker is for…"
              value={blurb}
              onChange={(e) => setBlurb(e.target.value.slice(0, 280))}
            />
          </label>

          <div className="btn-row">
            <button type="submit" className="btn btn-solid" disabled>
              Migrates when the first mint batch completes
            </button>
            <Link href="/docs/dust20" className="btn btn-ghost">
              DUST-20 rules
            </Link>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="panel-edit">
            <p className="kicker">Mint rules</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--ink-soft)]">
              <li>Each mint builds a UTXO of exactly unit_sats.</li>
              <li>Inscription offset must be 0.</li>
              <li>Transfer = spend that UTXO — no transfer opcode.</li>
              <li>First valid deploy for a ticker wins.</li>
            </ul>
          </div>
          <div className="panel-edit">
            <p className="byline">Deploy preview</p>
            <pre className="formula mt-3 text-[0.72rem]">{JSON.stringify(deployJson, null, 2)}</pre>
            <p className="mt-3 font-mono text-xs text-[var(--ink-mute)]">
              {canPreview ? "Invariants look consistent." : "Fix ticker / numeric fields to validate."}
              {blurb ? ` · Note: “${blurb.slice(0, 48)}${blurb.length > 48 ? "…" : ""}”` : ""}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
