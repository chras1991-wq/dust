import Link from "next/link";

export default function RisksDoc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="sticker sticker-hot">LORE 06</span>
      <h1 className="font-display mt-4 text-5xl font-extrabold uppercase">Risks</h1>
      <div className="panel-chaos mt-8 space-y-5 text-[var(--ink-dim)]">
        <ul className="list-disc space-y-3 pl-5">
          <li>DUST-20 is experimental, not consensus.</li>
          <li>Bitcoin Core does not recognize SATDUST.</li>
          <li>State depends on indexers staying alive.</li>
          <li>Wallet / market support is limited.</li>
          <li>No guaranteed value, listing, liquidity, or return.</li>
          <li>Wrong carrier sats or nonzero offset = invalid mint.</li>
          <li>End-game contention can leave mempool txs invalid.</li>
        </ul>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Lore index
          </Link>
        </p>
      </div>
    </article>
  );
}
