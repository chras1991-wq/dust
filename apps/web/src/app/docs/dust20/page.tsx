import Link from "next/link";

export default function Dust20Doc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="sticker sticker-cyan">LORE 03</span>
      <h1 className="font-display mt-4 text-5xl font-extrabold uppercase">DUST-20</h1>
      <div className="panel-chaos mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Spec <strong className="text-[var(--c-yellow)]">1.1.0</strong>, revised{" "}
          <strong className="text-[var(--c-yellow)]">2026-09-01</strong>. Bitcoin mainnet.
          Experimental.
        </p>
        <p>
          Not Bitcoin consensus. Meta-protocol over inscriptions + UTXO/satoshi flow. Compatible
          indexers define accepted state.
        </p>
        <p>
          Tickers case-folded. First valid deploy wins. Transfers have no separate message — spends
          derive allocation. UTXO selection is the danger zone.
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
