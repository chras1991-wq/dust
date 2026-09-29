import Link from "next/link";
import { UNIT_SATS } from "@satdust/shared";

export default function HowMintingWorks() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 03</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Mint execution</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          A mint is a commit/reveal inscription. The reveal must create the liquidity UTXO: carrier
          value equals declared <code className="font-mono text-[var(--accent)]">sats</code>,
          inscription at offset <code className="font-mono text-[var(--accent)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "1",
  "sats": "${UNIT_SATS}"
}`}</pre>
        <p>
          Rule of thumb:{" "}
          <code className="font-mono text-sm text-[var(--accent)]">amt × unit_sats = sats</code>, and
          the carrier output must match. Off-by-one layouts can confirm on Bitcoin and still be
          DUST-invalid.
        </p>
        <p>
          Price and quantity: <Link href="/mint">/mint</Link> only.
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
