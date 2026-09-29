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
          <strong className="text-[var(--ink)]">DUST-20</strong> is a Bitcoin mainnet protocol for
          fungible assets that live inside real satoshi UTXOs. Each accepted mint constructs a
          carrier output — spendable BTC — and binds the asset to it. That carrier is the liquidity
          UTXO.
        </p>
        <p>
          Bitcoin Core does not run DUST-20. The chain confirms transactions; compatible indexers
          decide which mints count. Wrong carrier size or a nonzero inscription offset can still
          confirm on L1 and fail as DUST.
        </p>
        <p>
          There is no transfer opcode. Move the carrier UTXO and the asset moves with it. Tickers
          ignore case; the first valid deploy for a name wins.
        </p>
        <p>
          SATDUST is the first ticker under these rules: one unit rides a {UNIT_SATS}-sat carrier.
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
