"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Essay" },
  { href: "/mint", label: "Mint" },
  { href: "/explorer", label: "Index" },
  { href: "/verify", label: "Prove" },
  { href: "/docs", label: "Archive" },
];

export function MarqueeBar() {
  const text =
    "Vol. I  ·  DUST-20  ·  Bitcoin Mainnet  ·  Meta-protocol  ·  Sat-bound  ·  Offset-0  ·  Indexer State  ·  Experimental  ·  ";
  return (
    <div className="issue-bar layer" aria-hidden>
      <div className="issue-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="layer border-b-[1.5px] border-[var(--ink)] bg-[var(--paper)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="byline">The Satoshi Review · Special Issue</p>
          <Link href="/" className="no-underline text-[var(--ink)]">
            <span className="masthead text-4xl md:text-5xl">SATDUST</span>
          </Link>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-condensed text-[0.8rem] uppercase tracking-[0.16em]">
          {LINKS.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "text-[var(--accent)] no-underline"
                    : "text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="layer mt-16 border-t-[1.5px] border-[var(--ink)]">
      <div className="bg-[var(--ink)] px-5 py-3">
        <p className="font-condensed text-[0.72rem] uppercase tracking-[0.16em] text-[var(--paper)]">
          Colophon · Not Bitcoin consensus · Indexer-dependent state
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <p className="max-w-xl text-[0.95rem] text-[var(--ink-soft)]">
            SATDUST is a DUST-20 meta-protocol asset. Bitcoin Core does not interpret SATDUST
            balances. Validity is defined by confirmed transactions plus compatible indexer rules.
            No guaranteed value, listing, or liquidity.
          </p>
          <div className="md:text-right">
            <p className="byline">Spec</p>
            <p className="font-display mt-2 text-2xl italic">DUST-20 v1.1.0</p>
            <p className="mt-1 font-sans text-sm text-[var(--ink-mute)]">
              Revised 2026-09-01 · Mainnet · Experimental
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
