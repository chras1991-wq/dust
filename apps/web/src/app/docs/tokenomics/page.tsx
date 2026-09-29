import Link from "next/link";
import {
  GENESIS_SUPPLY,
  MAX_SATS,
  MILESTONES,
  SUPPLY,
  UNIT_SATS,
  VOTE_SATDUST_EQUIV_BTC,
} from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 05</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Milestone mint</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Hard cap {SUPPLY.toLocaleString()} <strong className="text-[var(--ink)]">units</strong>{" "}
          (1 SATDUST = 1 unit, not a BRC-20 sheet). Genesis opens{" "}
          {GENESIS_SUPPLY.toLocaleString()} units. The rest is not a timed unlock — each of the 19
          later stages needs hard measurable gates (stake TVL, agents, AMM depth, vote turnout,
          live secondary price × circulating units) plus a holder vote. Large unlocks require that
          live secondary valuation ≥ $5M / $10M / $25M / $50M. Every unit locks {UNIT_SATS} sats (
          <code className="font-mono text-[var(--accent)]">
            max_sats = {MAX_SATS.toLocaleString()}
          </code>
          ). Mint fee $1 / unit on <Link href="/mint">/mint</Link>.
        </p>

        <pre className="formula">{`Mint_i = A_i × I(M_i) × I(Q_i ≥ Q_min) × I(V_i ≥ V_min)

S = ${GENESIS_SUPPLY} + Σ Mint_i   ≤   ${SUPPLY}`}</pre>

        <p>
          Hitting a milestone only lets someone open a mint vote — nothing new mints until it
          passes. Who can vote: wallet{" "}
          <strong className="text-[var(--ink)]">SATDUST</strong> worth ≥{" "}
          {VOTE_SATDUST_EQUIV_BTC} BTC at the live rate, checked at the proposal snapshot. Holding
          BTC alone does not qualify. Power: 1 wallet = 1 vote.
        </p>
        <p>
          After Genesis, the <strong className="text-[var(--ink)]">contributors whitelist</strong>{" "}
          mints first. Everyone else waits for the open window.
        </p>

        <div className="scroll-x">
          <table className="table-spec min-w-[32rem]">
            <thead>
              <tr>
                <th>#</th>
                <th>Milestone</th>
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
          Live roadmap: <Link href="/mint#milestones">/mint</Link>.
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
