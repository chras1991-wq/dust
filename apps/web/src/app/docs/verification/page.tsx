import Link from "next/link";

export default function VerificationDoc() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-pink">lore 05</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">Verification</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)]">
        <ul className="list-disc space-y-2 pl-5">
          <li>Mainnet tx exists and confirms</li>
          <li>DUST-20 mint inscription present</li>
          <li>p / op / tick / amt / sats match</li>
          <li>Carrier exactly 546 sats</li>
          <li>Inscription offset 0</li>
          <li>Deploy exists; supply not exceeded</li>
          <li>Indexer accepts</li>
        </ul>
        <p>
          <Link href="/verify" className="btn btn-solid">
            Open verifier
          </Link>
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
