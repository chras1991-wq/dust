import Link from "next/link";

export default function RisksDoc() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="byline">Archive · 06</p>
      <h1 className="masthead mt-2 text-5xl">Risks</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <ul className="list-disc space-y-3 pl-5">
          <li>DUST-20 is experimental, not consensus.</li>
          <li>Bitcoin Core does not recognize SATDUST.</li>
          <li>State depends on indexers staying available.</li>
          <li>Wallet / market support is limited.</li>
          <li>No guaranteed value, listing, liquidity, or return.</li>
          <li>Wrong carrier sats or nonzero offset = invalid mint.</li>
        </ul>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Archive
          </Link>
        </p>
      </div>
    </article>
  );
}
