"use client";

import { FeatureEntry } from "@/components/PrelaunchNotice";
import { SwapDesk } from "@/components/SwapDesk";
import { useSmoothMintProgress } from "@/hooks/useSmoothMintProgress";
import { GENESIS_SUPPLY } from "@satdust/shared";

const FEATURES = [
  {
    href: "/stake",
    code: "01 · Stake",
    title: "Stake",
    blurb: "Lock SATDUST for weight and rewards. Migrates with first mint.",
  },
  {
    href: "/agent",
    code: "02 · Agent",
    title: "Agent",
    blurb: "Agents that watch or act on your SATDUST UTXOs. Migrates with first mint.",
  },
  {
    href: "/compute",
    code: "03 · Compute",
    title: "Compute",
    blurb: "Commit hashrate against SATDUST collateral. Migrates with first mint.",
  },
  {
    href: "/auction",
    code: "04 · Auction",
    title: "Auction",
    blurb: "Bid on UTXO lots, whitelist seats, and mint batches. Migrates with first mint.",
  },
];

export default function ExplorerPage() {
  const { liveMinted, authorized, progressReady } = useSmoothMintProgress();
  const minted = progressReady && liveMinted != null ? liveMinted : null;
  const cap = authorized ?? GENESIS_SUPPLY;
  const progressLabel =
    minted != null ? `${minted.toLocaleString()} / ${cap.toLocaleString()}` : "…";

  return (
    <div className="page-shell max-w-5xl py-10 sm:py-14">
      <p className="byline">Index · Markets &amp; modules</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Index</h1>
      <p className="deck mt-3 max-w-2xl text-[0.95rem] sm:mt-4 sm:text-[1.05rem]">
        Swap SATDUST ⇄ BTC, then stake, agent, compute, auction. Swap migrates when the first mint
        batch completes.
      </p>

      <div className="stat-strip mt-8 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Minted"
          value={progressLabel}
        />
        <Stat label="Pool" value="Migrating" />
        <Stat label="Modules" value="4 desks" />
      </div>

      <div className="mt-10">
        <SwapDesk />
      </div>

      <section className="mt-12">
        <p className="byline">Modules</p>
        <h2 className="font-display mt-2 text-3xl sm:text-4xl">Modules</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-mute)]">
          Each opens a full desk. Execution migrates when the first mint batch completes.
        </p>
        <div className="feature-grid mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {FEATURES.map((f) => (
            <FeatureEntry key={f.href} {...f} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-edit">
      <p className="byline">{label}</p>
      <p className="font-display mt-2 text-2xl sm:text-3xl">{value}</p>
    </div>
  );
}
