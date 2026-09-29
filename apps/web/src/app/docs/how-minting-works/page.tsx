import Link from "next/link";
import { UNIT_SATS } from "@satdust/shared";

export default function HowMintingWorks() {
  return (
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Archive · 03</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl">Mint execution</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)]">
        <p>
          Commit/reveal inscription. The reveal must create a carrier whose value equals declared{" "}
          <code className="font-mono text-[var(--accent)]">sats</code>, with the inscription at
          offset <code className="font-mono text-[var(--accent)]">0</code>.
        </p>
        <pre className="formula">{`{
  "p": "dust-20",
  "op": "mint",
  "tick": "SATDUST",
  "amt": "1",
  "sats": "${UNIT_SATS}"
}`}</pre>
        <p>
          Constraint:{" "}
          <code className="font-mono text-sm text-[var(--accent)]">amt × unit_sats = sats</code>, and
          carrier.value matches. Price: <Link href="/mint">/mint</Link>.
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
