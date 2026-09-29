import Link from "next/link";

export default function Dust20Doc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-cyan">§ 02</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">DUST-20</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Specification <strong className="text-[var(--pink)]">1.1.0</strong>, revised{" "}
          <strong className="text-[var(--cyan)]">2026-09-01</strong>. Network: Bitcoin mainnet.
          Status: Experimental.
        </p>
        <p>
          DUST-20 is a meta-protocol. It does not extend Bitcoin consensus. Asset state is the
          product of (1) confirmed inscription payloads and (2) satoshi-flow rules applied by
          compatible indexers.
        </p>
        <p>
          Tickers are case-folded; the first valid deployment for an identity is permanent.
          Transfers have no dedicated opcode — spends reassign units by sat ordering across inputs
          and outputs.
        </p>
        <p>
          Public marketplace mutation APIs are not assumed. Any market integration is subject to
          ecosystem support and correct UTXO hygiene.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Docs index
          </Link>
        </p>
      </div>
    </article>
  );
}
