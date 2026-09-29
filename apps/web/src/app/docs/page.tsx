import Link from "next/link";

const DOCS = [
  {
    href: "/docs/what-is-satdust",
    title: "What is SATDUST",
    blurb: "Sat-bound meta-asset definition and phase-1 scope.",
    folio: "01",
  },
  {
    href: "/docs/dust20",
    title: "DUST-20",
    blurb: "Meta-protocol model, identity, indexing.",
    folio: "02",
  },
  {
    href: "/docs/how-minting-works",
    title: "Mint execution",
    blurb: "Commit/reveal, carrier invariants, offset-0.",
    folio: "03",
  },
  {
    href: "/docs/verification",
    title: "Verification",
    blurb: "Predicate checklist and indexer truth.",
    folio: "04",
  },
  {
    href: "/docs/tokenomics",
    title: "Satoshi binding",
    blurb: "unit_sats / max_sats invariants.",
    folio: "05",
  },
  {
    href: "/docs/risks",
    title: "Risks",
    blurb: "Experimental protocol disclosures.",
    folio: "06",
  },
];

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="byline">Archive · Technical papers</p>
      <h1 className="masthead mt-2 text-6xl">Archive</h1>
      <p className="deck mt-4">
        Protocol notes for implementers. Pricing remains on the mint desk only.
      </p>
      <ol className="mt-12 space-y-0">
        {DOCS.map((d) => (
          <li
            key={d.href}
            className="grid grid-cols-[auto_1fr] gap-5 border-t border-[var(--ink)] py-6"
          >
            <span className="folio text-2xl">{d.folio}</span>
            <div>
              <Link
                href={d.href}
                className="font-display text-2xl text-[var(--ink)] no-underline hover:text-[var(--accent)] md:text-3xl"
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
