import Link from "next/link";

export default function Dust20Doc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 02</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">DUST-20</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Specification <strong className="text-[var(--ink)]">1.1.0</strong>, revised{" "}
          <strong className="text-[var(--ink)]">2026-09-01</strong>. Bitcoin mainnet. Experimental.
        </p>
        <p>
          DUST-20 is a meta-protocol. It does not extend Bitcoin consensus. Asset state is the
          product of confirmed inscription payloads and satoshi-flow rules applied by compatible
          indexers.
        </p>
        <p>
          Tickers are case-folded; the first valid deployment for an identity is permanent.
          Transfers have no dedicated opcode.
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
