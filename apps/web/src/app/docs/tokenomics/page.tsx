import Link from "next/link";
import {
  GENESIS_SUPPLY,
  MAX_SATS,
  MILESTONES,
  SUPPLY,
  UNIT_SATS,
  VOTE_BTC_THRESHOLD,
} from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 05</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Milestone issuance</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Cap {SUPPLY.toLocaleString()} units. Genesis {GENESIS_SUPPLY.toLocaleString()} at launch.
          The rest is not a timed unlock — each tranche needs a completed milestone and a community
          vote. Per-unit carrier size is still {UNIT_SATS} sats (
          <code className="font-mono text-[var(--accent)]">
            max_sats = {MAX_SATS.toLocaleString()}
          </code>
          ). Sale price lives on <Link href="/mint">/mint</Link>.
        </p>

        <pre className="formula">{`Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)

S = ${GENESIS_SUPPLY} + Σ Mint_i   ≤   ${SUPPLY}`}</pre>

        <p>
          Completing a milestone unlocks proposal capacity only. Eligible voters: wallet BTC ≥{" "}
          {VOTE_BTC_THRESHOLD} at the proposal snapshot. Power: 1 wallet = 1 vote.
        </p>

        <div className="scroll-x">
          <table className="table-spec min-w-[32rem]">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Event</th>
                <th>Amount</th>
                <th>Supply after</th>
              </tr>
            </thead>
            <tbody>
              {MILESTONES.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono">{m.code}</td>
                  <td>
                    <span className="text-[var(--ink)]">{m.title}</span>
                    <span className="mt-0.5 block text-xs text-[var(--ink-mute)]">{m.blurb}</span>
                  </td>
                  <td className="font-mono">+{m.amount.toLocaleString()}</td>
                  <td className="font-mono">{m.supplyAfter.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Full roadmap and live goal progress: <Link href="/mint#milestones">/mint</Link>.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Archive
          </Link>
        </p>
      </div>
    </article>
  );
}
