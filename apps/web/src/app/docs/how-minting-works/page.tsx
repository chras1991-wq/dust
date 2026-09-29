import Link from "next/link";

export default function HowMintingWorks() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="sticker sticker-hot">LORE 02</span>
      <h1 className="font-display mt-4 text-5xl font-extrabold uppercase">How minting works</h1>
      <div className="panel-chaos mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Commit/reveal inscription flow. Reveal must create a carrier of exactly{" "}
          <code className="font-mono text-[var(--c-yellow)]">546</code> sats with the mint
          inscription at offset <code className="font-mono text-[var(--c-cyan)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "1",
  "sats": "546"
}`}</pre>
        <p>
          Constraints: <code className="font-mono text-sm text-[var(--c-lime)]">amt × unit_sats = sats</code>{" "}
          and carrier = sats. Off-by-one can confirm on Bitcoin and still be DUST-INVALID.
        </p>
        <pre className="formula">{`OUT0  user     546 sats   carrier + inscription @ 0
OUT1  project  quote.feeSats
OUT2  change   optional
miner fee from non-colored UTXOs`}</pre>
        <p>
          <Link href="/docs" className="btn btn-ghost">
            ← Lore index
          </Link>
        </p>
      </div>
    </article>
  );
}
