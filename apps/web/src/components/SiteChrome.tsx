"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROJECT_ADDRESS } from "@satdust/shared";

const LINKS = [
  { href: "/", label: "home", pill: "pill-chrome" },
  { href: "/mint", label: "mint", pill: "pill-pink" },
  { href: "/explorer", label: "scan", pill: "pill-cyan" },
  { href: "/verify", label: "check", pill: "pill-lime" },
  { href: "/docs", label: "lore", pill: "pill-chrome" },
];

export function MarqueeBar() {
  const text =
    "SATDUST ★ Y2K DUST ★ CARRIED BY SATS ★ 10,000 ★ 546 SATS ★ $7 MINT ★ NO PREMINE ★ FAIR MINT ★ DUST-20 ★ MAINNET ★ ";
  return (
    <div className="marquee layer" aria-hidden>
      <div className="marquee-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="layer chrome-bar">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="no-underline">
            <span className="chrome-text text-2xl sm:text-3xl">SATDUST</span>
          </Link>
          <span className="pill pill-pink animate-sparkle">online</span>
        </div>
        <nav className="flex flex-wrap gap-2">
          {LINKS.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`pill ${l.pill} no-underline ${active ? "ring-2 ring-[var(--pink)]" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/30 bg-[#0b0a1a]/px-4 py-2">
        <p className="mx-auto max-w-6xl overflow-x-auto font-mono text-lg text-[var(--cyan)]">
          fee_sink :: <span className="text-[var(--pink)]">{PROJECT_ADDRESS}</span>
        </p>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="layer mt-12">
      <div className="bg-gradient-to-r from-[var(--pink)] via-[var(--cyan)] to-[var(--lime)] px-4 py-2">
        <p className="font-pixel text-[0.55rem] uppercase text-[#0b0a1a]">
          risk dump † experimental meta-protocol vibes
        </p>
      </div>
      <div className="bg-[#070614] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-3xl text-sm text-[var(--ink-dim)]">
            SATDUST rides experimental DUST-20. Not Bitcoin consensus. Bitcoin Core does not
            see SATDUST. Indexers decide state. Wallet / market support is thin. No guaranteed
            value, listing, liquidity, or return.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="pill pill-chrome">dust-20 1.1.0</span>
            <span className="pill pill-cyan">mainnet</span>
            <span className="pill pill-pink">experimental</span>
            <span className="pill pill-lime">no premine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
