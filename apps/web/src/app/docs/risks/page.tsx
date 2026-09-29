import Link from "next/link";

export default function RisksDoc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 06</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Risks</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <ul className="list-disc space-y-3 pl-5">
          <li>Experimental. Not Bitcoin consensus.</li>
          <li>Balances depend on indexers.</li>
          <li>Wallet and market support may be thin.</li>
          <li>No guaranteed value, listing, or return.</li>
          <li>Wrong carrier or nonzero offset → invalid mint.</li>
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
