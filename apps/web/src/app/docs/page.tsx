import Link from "next/link";

const DOCS = [
  {
    href: "/docs/what-is-satdust",
    title: "What is SATDUST",
    blurb: "Opening ticker — one unit, 546 sats in the UTXO.",
    folio: "01",
  },
  {
    href: "/docs/dust20",
    title: "DUST-20",
    blurb: "Tokens that lock real sats in a UTXO on Bitcoin.",
    folio: "02",
  },
  {
    href: "/docs/how-minting-works",
    title: "How minting works",
    blurb: "Commit/reveal, exact sats, offset zero.",
    folio: "03",
  },
  {
    href: "/docs/verification",
    title: "Verification",
    blurb: "Checks before a mint counts.",
    folio: "04",
  },
  {
    href: "/docs/tokenomics",
    title: "Milestone mint",
    blurb: "Genesis 5,460 + 12 voted batches to 54,600.",
    folio: "05",
  },
  {
    href: "/docs/risks",
    title: "Risks",
    blurb: "Experimental. Indexer-dependent.",
    folio: "06",
  },
];

export default function DocsIndex() {
  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl">Archive</h1>
      <p className="deck mt-4">Short notes. Mint price only on /mint.</p>
      <ol className="mt-8 space-y-0 sm:mt-12">
        {DOCS.map((d) => (
          <li
            key={d.href}
            className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-[var(--ink)] py-5 sm:grid-cols-[auto_1fr] sm:gap-5 sm:py-6"
          >
            <span className="folio text-xl sm:text-2xl">{d.folio}</span>
            <div className="min-w-0">
              <Link
                href={d.href}
                className="font-display text-xl text-[var(--ink)] no-underline hover:text-[var(--accent)] sm:text-2xl md:text-3xl"
              >
                {d.title}
              </Link>
              <p className="mt-2 text-sm text-[var(--ink-mute)]">{d.blurb}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
