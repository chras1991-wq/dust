import Link from "next/link";
import { MAX_SATS, PROJECT_ADDRESS } from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="sticker sticker-lime">LORE 04</span>
      <h1 className="font-display mt-4 text-5xl font-extrabold uppercase">Tokenomics</h1>
      <div className="panel-chaos mt-8 space-y-5 text-[var(--ink-dim)]">
        <pre className="formula">{`feeSats = round( 7 / BTCUSD × 100_000_000 )`}</pre>
        <p>
          $7 USD ≡ BTC from median of Coinbase / Kraken / Bitstamp. Quotes expire in 60 seconds.
        </p>
        <p>
          Max gross mint fee if sold out: $70,000 ≡ BTC. Aggregate backing{" "}
          {MAX_SATS.toLocaleString()} sats is not project income.
        </p>
        <p className="break-all font-mono text-sm text-[var(--c-cyan)]">{PROJECT_ADDRESS}</p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Lore index
          </Link>
        </p>
      </div>
    </article>
  );
}
