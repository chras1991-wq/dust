import Link from "next/link";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 05</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Satoshi binding</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Deploy locks a permanent ratio between protocol units and carrier sats. Pricing is
          omitted here — see <Link href="/mint">/mint</Link>.
        </p>
        <pre className="formula">{`max_sats = supply × unit_sats
${MAX_SATS} = ${SUPPLY} × ${UNIT_SATS}`}</pre>
        <p>
          Aggregate carrier sats are carrying capacity under DUST-20 allocation — not protocol
          revenue.
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
