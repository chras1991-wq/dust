import Link from "next/link";

export default function Dust20Doc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-lime">lore 03</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">DUST-20</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Spec <strong className="text-[var(--pink)]">1.1.0</strong>, revised{" "}
          <strong className="text-[var(--cyan)]">2026-09-01</strong>. Bitcoin mainnet. Experimental.
        </p>
        <p>
          Not Bitcoin consensus. Meta-protocol over inscriptions + UTXO/satoshi flow. Compatible
          indexers define accepted state. Tickers case-folded. First valid deploy wins.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Lore index
          </Link>
        </p>
      </div>
    </article>
  );
}
