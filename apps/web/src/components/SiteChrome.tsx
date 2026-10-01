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
    "DUST-20  ·  Sats locked in the UTXO  ·  Bitcoin Mainnet  ·  SATDUST  ·  Offset-0  ·  Experimental  ·  ";
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
          aria-orientation="horizontal"
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

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="layer mt-12 border-t-[1.5px] border-[var(--ink)] sm:mt-16">
      <div className="bg-[var(--ink)]">
        <div className="page-shell flex items-center justify-between gap-4 py-3">
          <p className="min-w-0 font-condensed text-[0.65rem] uppercase leading-relaxed tracking-[0.12em] text-[var(--paper)] sm:text-[0.72rem] sm:tracking-[0.16em]">
            Colophon · Not Bitcoin consensus · Indexer-dependent state
          </p>
          <a
            href="https://x.com/sat_dust20"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Official Twitter / X — @sat_dust20"
            title="@sat_dust20"
            className="social-x inline-flex shrink-0 items-center justify-center text-[var(--paper)] no-underline opacity-75 transition-opacity hover:text-[var(--paper)] hover:opacity-100"
          >
            <TwitterIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </a>
        </div>
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
            <div className="mt-3 flex items-center gap-3 md:justify-end">
              <p className="font-sans text-sm text-[var(--ink-mute)]">
                Revised 2026-09-01 · Mainnet · Experimental
              </p>
              <a
                href="https://x.com/sat_dust20"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official X / Twitter — @sat_dust20"
                title="@sat_dust20"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--ink)] bg-white text-[var(--ink)] no-underline transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
