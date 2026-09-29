import Link from "next/link";

export default function VerificationDoc() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 04</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Verification</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <ul className="list-disc space-y-2 pl-5">
          <li>Mainnet tx exists and confirms</li>
          <li>DUST-20 mint inscription present</li>
          <li>p / op / tick / amt / sats match</li>
          <li>Carrier exactly matches declared sats</li>
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
            ← Archive
          </Link>
        </p>
      </div>
    </article>
  );
}
