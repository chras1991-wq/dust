import Link from "next/link";

export default function HowMintingWorks() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ D.2</p>
      <h1 className="font-display mt-2 text-4xl">How minting works</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>
          Mint uses a commit/reveal inscription flow. The reveal transaction must create a
          carrier output of exactly <code className="font-mono text-[var(--accent)]">546</code>{" "}
          sats with the mint inscription at satoshi offset <code className="font-mono text-[var(--accent)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "1",
  "sats": "546"
}`}</pre>
        <p>
          Constraints: <code className="font-mono text-sm text-[var(--accent)]">amt × unit_sats = sats</code>{" "}
          and carrier output value = sats. 545 or 547 sats may confirm on Bitcoin and still be
          DUST-INVALID.
        </p>
        <p>Reveal layout:</p>
        <pre className="formula">{`OUTPUT 0  user address     546 sats   (carrier + inscription @ offset 0)
OUTPUT 1  project address  quote.feeSats
OUTPUT 2  user change      (optional)
miner fee from other non-colored UTXOs`}</pre>
        <p>
          Never reduce the carrier to pay fees. Never spend Ordinals / Runes / DUST-20 /
          BRC-20 colored UTXOs as funding inputs.
        </p>
        <p>
          Fees are quoted server-side as a signed 60-second quote. Frontend and backend both
          abort if the project address is not the hardcoded constant.
        </p>
        <p>
          <Link href="/docs">← Spec index</Link>
        </p>
      </div>
    </article>
  );
}
