import Link from "next/link";

const DOCS = [
  {
    href: "/docs/what-is-satdust",
    title: "What is SATDUST",
    blurb: "Sat-bound meta-asset definition and phase-1 scope.",
    pill: "pill-pink",
  },
  {
    href: "/docs/dust20",
    title: "DUST-20",
    blurb: "Meta-protocol model, identity, indexing.",
    pill: "pill-cyan",
  },
  {
    href: "/docs/how-minting-works",
    title: "Mint execution",
    blurb: "Commit/reveal, carrier invariants, offset-0.",
    pill: "pill-lime",
  },
  {
    href: "/docs/verification",
    title: "Verification",
    blurb: "Predicate checklist and indexer truth.",
    pill: "pill-chrome",
  },
  {
    href: "/docs/tokenomics",
    title: "Satoshi binding",
    blurb: "unit_sats / max_sats invariants (no pricing).",
    pill: "pill-pink",
  },
  {
    href: "/docs/risks",
    title: "Risks",
    blurb: "Experimental protocol disclosures.",
    pill: "pill-cyan",
  },
];

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-pink">technical docs</span>
      <h1 className="hologram-text hero-title mt-4 text-6xl">DOCS</h1>
      <p className="mt-3 text-[var(--ink-dim)]">
        Protocol notes for implementers. Pricing lives on the mint surface only.
      </p>
      <ol className="mt-10 space-y-4">
        {DOCS.map((d, i) => (
          <li key={d.href} className="panel-y2k">
            <span className={`pill ${d.pill}`}>{String(i + 1).padStart(2, "0")}</span>
            <Link
              href={d.href}
              className="chrome-text mt-3 block text-2xl no-underline hover:opacity-90"
            >
              {d.title}
            </Link>
            <p className="mt-2 text-sm text-[var(--ink-dim)]">{d.blurb}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
