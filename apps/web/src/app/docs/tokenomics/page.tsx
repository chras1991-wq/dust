import Link from "next/link";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 05</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Satoshi binding</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Deploy locks how many sats back each unit. That ratio is the liquidity UTXO size — not a
          price. Mint pricing is only on <Link href="/mint">/mint</Link>.
        </p>
        <pre className="formula">{`max_sats = supply × unit_sats
${MAX_SATS} = ${SUPPLY} × ${UNIT_SATS}`}</pre>
        <p>
          Fully minted, SATDUST sits on {MAX_SATS.toLocaleString()} sats of carrier capacity across
          all units. Those sats are the assets&apos; liquidity floor on L1, not protocol revenue.
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
