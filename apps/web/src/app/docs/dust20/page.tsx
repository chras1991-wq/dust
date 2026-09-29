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
          <strong className="text-[var(--ink)]">DUST-20</strong> is the first Bitcoin-native
          protocol that constructs liquidity UTXOs: each accepted mint builds a carrier output of
          real sats and binds the asset to it.
        </p>
        <p>
          Bitcoin Core does not execute DUST-20. The chain confirms transactions; compatible
          indexers decide which mints count. A wrong carrier or nonzero inscription offset can
          confirm on L1 and still fail.
        </p>
        <p>
          Transfers use ordinary spends of the carrier — there is no transfer opcode. Tickers are
          case-insensitive; first valid deploy wins. SATDUST opens the set: one unit on a{" "}
          {UNIT_SATS}-sat carrier.
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
