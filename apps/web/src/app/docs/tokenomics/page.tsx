import Link from "next/link";
import { MAX_SATS, PROJECT_ADDRESS } from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ D.4</p>
      <h1 className="font-display mt-2 text-4xl">Tokenomics</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-dim)]">
        <pre className="formula">{`feeSats = round( 7 / BTCUSD × 100_000_000 )`}</pre>
        <p>
          Mint fee is always $7 USD equivalent BTC from a median of multiple spot providers
          (Coinbase, Kraken, Bitstamp), with outlier filtering. Quotes expire in 60 seconds.
        </p>
        <p>
          Maximum theoretical gross mint fee if fully minted: 10,000 × $7 = $70,000 equivalent
          BTC. The {MAX_SATS.toLocaleString()} sats of aggregate backing are not project
          income.
        </p>
        <p className="font-mono text-sm break-all text-[var(--accent)]">{PROJECT_ADDRESS}</p>
        <p>
          <Link href="/docs">← Spec index</Link>
        </p>
      </div>
    </article>
  );
}
