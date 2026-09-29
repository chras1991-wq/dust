import Link from "next/link";

export default function HowMintingWorks() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-lime">§ 03</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">Mint execution</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Mints use a commit/reveal inscription envelope. The reveal transaction must create a
          carrier output whose value equals the declared{" "}
          <code className="font-mono text-lg text-[var(--cyan)]">sats</code> field, with the
          inscription at satoshi offset <code className="font-mono text-lg text-[var(--pink)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "...",
  "sats": "..."
}`}</pre>
        <p>
          Constraint: <code className="font-mono text-lg text-[var(--lime)]">amt × unit_sats = sats</code>{" "}
          and <code className="font-mono text-lg text-[var(--lime)]">carrier.value = sats</code>.
          Off-by-one layouts can confirm on Bitcoin and still be DUST-INVALID.
        </p>
        <pre className="formula">{`OUT0  user carrier   value == sats   inscription @ offset 0
OUTn  funding / change / fees from non-colored UTXOs
never subtract sats from the carrier to pay miners`}</pre>
        <p>
          Operational pricing and quantity UI: <Link href="/mint">/mint</Link> only.
        </p>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Docs index
          </Link>
        </p>
      </div>
    </article>
  );
}
