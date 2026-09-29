import Link from "next/link";

const DOCS = [
  { href: "/docs/what-is-satdust", title: "What is SATDUST", blurb: "Project definition and phase-1 scope.", pill: "pill-pink" },
  { href: "/docs/how-minting-works", title: "How minting works", blurb: "Commit/reveal, carrier sats, fees.", pill: "pill-cyan" },
  { href: "/docs/dust20", title: "DUST-20", blurb: "Meta-protocol facts, v1.1.0.", pill: "pill-lime" },
  { href: "/docs/tokenomics", title: "Tokenomics", blurb: "Supply, fee, backing decomposition.", pill: "pill-chrome" },
  { href: "/docs/verification", title: "Verification", blurb: "On-chain checks and indexer truth.", pill: "pill-pink" },
  { href: "/docs/risks", title: "Risks", blurb: "Experimental protocol disclosures.", pill: "pill-cyan" },
];

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-pink">lore stack</span>
      <h1 className="hologram-text hero-title mt-4 text-6xl">DOCS</h1>
      <p className="mt-3 text-[var(--ink-dim)]">Protocol notes for builders.</p>
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
