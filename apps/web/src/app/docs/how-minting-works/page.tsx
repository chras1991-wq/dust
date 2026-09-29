import Link from "next/link";

export default function HowMintingWorks() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-cyan">lore 02</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">How minting works</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Commit/reveal inscription flow. Reveal must create a carrier of exactly{" "}
          <code className="font-mono text-lg text-[var(--cyan)]">546</code> sats with the mint
          inscription at offset <code className="font-mono text-lg text-[var(--pink)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "1",
  "sats": "546"
}`}</pre>
        <p>
          Constraints: <code className="font-mono text-lg text-[var(--lime)]">amt × unit_sats = sats</code>{" "}
          and carrier = sats. Off-by-one can confirm on Bitcoin and still be DUST-INVALID.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Lore index
          </Link>
        </p>
      </div>
    </article>
  );
}
