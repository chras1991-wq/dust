import Link from "next/link";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function TokenomicsDoc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-chrome">§ 04</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">Satoshi binding</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Deploy locks a permanent ratio between protocol units and carrier sats. Pricing and
          mint-fee quotes are intentionally omitted here — see{" "}
          <Link href="/mint">/mint</Link>.
        </p>
        <pre className="formula">{`max_sats = supply × unit_sats
${MAX_SATS} = ${SUPPLY} × ${UNIT_SATS}`}</pre>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="text-[var(--cyan)]">unit_sats</code> — sats bound to one accepted unit
          </li>
          <li>
            <code className="text-[var(--cyan)]">lim_sats</code> — maximum sats in a single mint
            inscription
          </li>
          <li>
            <code className="text-[var(--cyan)]">max_sats</code> — aggregate sat capacity implied by
            supply
          </li>
        </ul>
        <p>
          Aggregate carrier sats are not protocol “revenue”; they are the carrying capacity of
          accepted mints under DUST-20 allocation rules.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Docs index
          </Link>
        </p>
      </div>
    </article>
  );
}
