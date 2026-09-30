import Link from "next/link";
import { UNIT_SATS } from "@satdust/shared";

export default function Dust20Doc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 02</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">DUST-20</h1>
      <p className="deck mt-4">
        Spec 1.1.0 · 2026-09-01 · Bitcoin mainnet · Experimental
      </p>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          <strong className="text-[var(--ink)]">DUST-20</strong> mints tokens that lock real sats
          in a UTXO. Accept a mint and that output holds the asset and the sats together.
        </p>
        <p>
          Bitcoin Core does not run DUST-20. The chain confirms txs; indexers decide which mints
          count. Wrong sats or a nonzero inscription offset can confirm on L1 and still fail.
        </p>
        <p>
          Transfer is a normal spend of that UTXO — there is no transfer opcode. Tickers ignore
          case; first valid deploy wins. SATDUST is the opening ticker: one unit on a{" "}
          {UNIT_SATS}-sat UTXO.
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
