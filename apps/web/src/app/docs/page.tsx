import Link from "next/link";

const DOCS = [
  {
    href: "/docs/what-is-satdust",
    title: "What is SATDUST",
    blurb: "Project definition and phase-1 scope.",
    color: "sticker-orange",
  },
  {
    href: "/docs/how-minting-works",
    title: "How minting works",
    blurb: "Commit/reveal, carrier sats, fees.",
    color: "sticker-hot",
  },
  {
    href: "/docs/dust20",
    title: "DUST-20",
    blurb: "Meta-protocol facts, v1.1.0.",
    color: "sticker-cyan",
  },
  {
    href: "/docs/tokenomics",
    title: "Tokenomics",
    blurb: "Supply, fee, backing decomposition.",
    color: "sticker-lime",
  },
  {
    href: "/docs/verification",
    title: "Verification",
    blurb: "On-chain checks and indexer truth.",
    color: "sticker-yellow",
  },
  {
    href: "/docs/risks",
    title: "Risks",
    blurb: "Experimental protocol disclosures.",
    color: "sticker-hot",
  },
];

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <span className="sticker sticker-magenta sticker-hot" style={{ ["--rot" as string]: "3deg" }}>
        LORE STACK
      </span>
      <h1 className="hero-title mt-4 text-6xl">DOCS</h1>
      <p className="mt-3 text-[var(--ink-dim)]">
        Protocol notes for builders. Dense on purpose.
      </p>
      <ol className="mt-10 space-y-4">
        {DOCS.map((d, i) => (
          <li key={d.href} className="panel-chaos">
            <span className={`sticker ${d.color}`} style={{ ["--rot" as string]: `${(i % 5) - 2}deg` }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <Link
              href={d.href}
              className="font-display mt-3 block text-2xl font-extrabold uppercase no-underline text-[var(--c-cream)] hover:text-[var(--c-yellow)]"
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
