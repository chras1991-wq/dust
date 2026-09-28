import Link from "next/link";

export default function RisksDoc() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ D.6</p>
      <h1 className="font-display mt-2 text-4xl">Risks</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-dim)]">
        <ul className="list-disc space-y-3 pl-5">
          <li>DUST-20 is experimental and not Bitcoin consensus.</li>
          <li>Bitcoin Core does not recognize SATDUST balances.</li>
          <li>Asset state depends on compatible indexers remaining available.</li>
          <li>Wallet and marketplace support is currently limited / often read-only.</li>
          <li>No guarantee of future ecosystem support, listings, or liquidity.</li>
          <li>Off-by-one carrier sats or nonzero inscription offsets invalidate mints.</li>
          <li>Supply contention near sell-out can leave mempool txs ultimately invalid.</li>
        </ul>
        <p>
          This site will not claim guaranteed value, guaranteed listing, guaranteed
          liquidity, guaranteed return, or a dated exchange listing.
        </p>
        <p>
          <Link href="/docs">← Spec index</Link>
        </p>
      </div>
    </article>
  );
}
