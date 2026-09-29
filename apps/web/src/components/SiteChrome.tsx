"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Essay" },
  { href: "/mint", label: "Mint" },
  { href: "/explorer", label: "Index" },
  { href: "/create", label: "Create" },
  { href: "/verify", label: "Prove" },
  { href: "/docs", label: "Archive" },
];

export function MarqueeBar() {
  const text =
    "DUST-20  ·  First liquidity UTXO protocol  ·  Bitcoin Mainnet  ·  SATDUST  ·  Offset-0  ·  Experimental  ·  ";
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
    <header className="layer sticky top-0 z-40 border-b-[1.5px] border-[var(--ink)] bg-[var(--paper)]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="page-shell flex flex-col gap-2 py-2.5 sm:gap-4 sm:py-4 md:flex-row md:items-end md:justify-between md:py-5">
        <div className="min-w-0">
          <p className="byline truncate">The Satoshi Review · Special Issue</p>
          <Link href="/" className="no-underline">
            <span className="masthead text-[2.1rem] leading-none text-[var(--accent)] sm:text-4xl md:text-5xl">
              SATDUST
            </span>
          </Link>
        </div>
        <nav
          className="nav-scroll font-condensed text-[0.78rem] uppercase tracking-[0.14em]"
          aria-label="Primary"
        >
          {LINKS.map((l) => {
            const moduleRoutes = ["/stake", "/agent", "/compute", "/auction"];
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href)) ||
              (l.href === "/explorer" && moduleRoutes.some((r) => pathname.startsWith(r)));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)] no-underline hover:text-[var(--paper)]"
                    : "text-[var(--accent)] no-underline hover:bg-[var(--ink)] hover:text-[var(--paper)]"
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
    <footer className="layer mt-12 border-t-[1.5px] border-[var(--ink)] sm:mt-16">
      <div className="bg-[var(--ink)] px-4 py-3 sm:px-5">
        <p className="font-condensed text-[0.65rem] uppercase leading-relaxed tracking-[0.12em] text-[var(--paper)] sm:text-[0.72rem] sm:tracking-[0.16em]">
          Colophon · Not Bitcoin consensus · Indexer-dependent state
        </p>
      </div>
      <div className="page-shell py-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <p className="max-w-xl text-[0.95rem] text-[var(--ink-soft)]">
            SATDUST mints under DUST-20 on Bitcoin mainnet. Bitcoin Core does not interpret balances;
            confirmed txs and compatible indexers do. No guaranteed value or listing.
          </p>
          <div className="md:text-right">
            <p className="byline">Spec</p>
            <p className="font-display mt-2 text-xl italic sm:text-2xl">DUST-20 v1.1.0</p>
            <p className="mt-1 font-sans text-sm text-[var(--ink-mute)]">
              Revised 2026-09-01 · Mainnet · Experimental
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
