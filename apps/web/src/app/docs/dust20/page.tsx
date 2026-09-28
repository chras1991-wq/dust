import Link from "next/link";

export default function Dust20Doc() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ D.3</p>
      <h1 className="font-display mt-2 text-4xl">DUST-20</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Current specification: <strong className="text-[var(--ink)]">version 1.1.0</strong>,
          revised <strong className="text-[var(--ink)]">2026-09-01</strong>. Network: Bitcoin
          mainnet. Status: Experimental.
        </p>
        <p>
          DUST-20 is not a Bitcoin consensus protocol. It is a meta-protocol over inscription
          payloads plus UTXO/satoshi flow rules. Compatible indexers define accepted asset
          state.
        </p>
        <p>
          Tickers are case-folded. The first valid deployment for a ticker identity is the
          only effective deployment. Before deploying SATDUST, re-check authoritative
          indexer results for occupation.
        </p>
        <p>
          Transfers do not use a separate transfer message. Asset movement is derived from
          ordinary Bitcoin spends and satoshi ordering across inputs and outputs. Wallet UTXO
          selection and change layout are therefore high-risk surfaces for any later market
          integration.
        </p>
        <p>
          Public marketplace mutation APIs (buy/sell/list/offer/settle) are not assumed
          available. Roadmap marketplace work is subject to ecosystem support — not a dated
          launch promise.
        </p>
        <p>
          <Link href="/docs">← Spec index</Link>
        </p>
      </div>
    </article>
  );
}
