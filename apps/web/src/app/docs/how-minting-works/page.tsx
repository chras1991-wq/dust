import Link from "next/link";

export default function HowMintingWorks() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="byline">Archive · 03</p>
      <h1 className="masthead mt-2 text-5xl">Mint execution</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Mints use a commit/reveal inscription envelope. The reveal must create a carrier whose
          value equals declared <code className="font-mono text-[var(--accent)]">sats</code>, with
          the inscription at offset <code className="font-mono text-[var(--accent)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "...",
  "sats": "..."
}`}</pre>
        <p>
          Constraint:{" "}
          <code className="font-mono text-sm text-[var(--accent)]">amt × unit_sats = sats</code> and
          carrier.value = sats. Off-by-one layouts can confirm on Bitcoin and remain DUST-INVALID.
        </p>
        <p>
          Operational pricing: <Link href="/mint">/mint</Link> only.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Archive
          </Link>
        </p>
      </div>
    </article>
  );
}
