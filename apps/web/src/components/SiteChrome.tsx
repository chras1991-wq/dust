"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROJECT_ADDRESS } from "@satdust/shared";

const LINKS = [
  { href: "/", label: "Abstract" },
  { href: "/mint", label: "Mint" },
  { href: "/explorer", label: "Explorer" },
  { href: "/verify", label: "Verify" },
  { href: "/docs", label: "Spec" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="paper border-b border-[var(--rule)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="no-underline">
            <span className="font-display text-2xl tracking-tight text-[var(--ink)]">
              SATDUST
            </span>
          </Link>
          <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
            DUST-20 · v1.1.0 · Bitcoin Mainnet · Experimental
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.1em]">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "text-[var(--accent)] no-underline"
                    : "text-[var(--ink-dim)] no-underline hover:text-[var(--ink)]"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mx-auto max-w-5xl overflow-x-auto px-5 pb-3">
        <p className="font-mono text-[0.65rem] text-[var(--ink-faint)]">
          Project address{" "}
          <span className="text-[var(--ink-dim)]">{PROJECT_ADDRESS}</span>
        </p>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="paper border-t border-[var(--rule)]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--accent)]">
          Risk disclosure<sup>†</sup>
        </p>
        <p className="mt-3 max-w-3xl text-sm text-[var(--ink-dim)]">
          SATDUST uses the experimental DUST-20 meta-protocol. DUST-20 is not Bitcoin
          consensus. Bitcoin Core does not recognize SATDUST. Asset state depends on
          compatible indexers. Wallet and marketplace support is limited. No guaranteed
          value, listing, liquidity, or return.
        </p>
        <p className="footnote">
          † DUST-20 specification version 1.1.0, revised 2026-09-01. Network: Bitcoin
          mainnet. Status: Experimental.
        </p>
      </div>
    </footer>
  );
}
