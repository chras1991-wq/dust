import Link from "next/link";

export default function VerificationDoc() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">§ D.5</p>
      <h1 className="font-display mt-2 text-4xl">Verification</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-dim)]">
        <p>A mint is valid only when all of the following hold:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Bitcoin mainnet transaction exists and confirms</li>
          <li>DUST-20 mint inscription present</li>
          <li>p, op, tick, amt, sats match SATDUST rules</li>
          <li>Carrier output exactly 546 sats</li>
          <li>Inscription at output satoshi offset 0</li>
          <li>Deployment exists; supply not exceeded</li>
          <li>Authoritative DUST-20 indexer accepts the mint</li>
        </ul>
        <p>
          Database rows are caches. Reorgs move CONFIRMED back to PENDING. RBF replacements
          must be re-evaluated; the original reveal is not automatically valid.
        </p>
        <p>
          <Link href="/verify">Open verifier →</Link>
        </p>
        <p>
          <Link href="/docs">← Spec index</Link>
        </p>
      </div>
    </article>
  );
}
