import Link from "next/link";

const DOCS = [
  {
    href: "/docs/what-is-satdust",
    title: "What is SATDUST",
    blurb: "Project definition and phase-1 scope.",
  },
  {
    href: "/docs/how-minting-works",
    title: "How minting works",
    blurb: "Commit/reveal, carrier sats, fees.",
  },
  {
    href: "/docs/dust20",
    title: "DUST-20",
    blurb: "Meta-protocol facts, v1.1.0.",
  },
  {
    href: "/docs/tokenomics",
    title: "Tokenomics",
    blurb: "Supply, fee, backing decomposition.",
  },
  {
    href: "/docs/verification",
    title: "Verification",
    blurb: "On-chain checks and indexer truth.",
  },
  {
    href: "/docs/risks",
    title: "Risks",
    blurb: "Experimental protocol disclosures.",
  },
];

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ Spec</p>
      <h1 className="font-display mt-2 text-5xl">Documentation</h1>
      <p className="mt-4 text-[var(--ink-dim)]">
        Protocol notes for implementers. Prefer primary sources over marketing copy.
      </p>
      <ol className="mt-10 space-y-6">
        {DOCS.map((d, i) => (
          <li key={d.href} className="border-b border-[var(--rule)] pb-6">
            <p className="font-mono text-[0.7rem] text-[var(--ink-faint)]">
              {String(i + 1).padStart(2, "0")}
            </p>
            <Link href={d.href} className="font-display mt-1 block text-2xl no-underline text-[var(--ink)] hover:text-[var(--accent)]">
              {d.title}
            </Link>
            <p className="mt-2 text-sm text-[var(--ink-dim)]">{d.blurb}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
