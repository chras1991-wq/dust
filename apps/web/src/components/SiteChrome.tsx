"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "spec", pill: "pill-chrome" },
  { href: "/mint", label: "mint", pill: "pill-pink" },
  { href: "/explorer", label: "index", pill: "pill-cyan" },
  { href: "/verify", label: "prove", pill: "pill-lime" },
  { href: "/docs", label: "docs", pill: "pill-chrome" },
];

export function MarqueeBar() {
  const text =
    "DUST-20 v1.1.0 ★ META-PROTOCOL ★ INSCRIPTION + SAT FLOW ★ OFFSET-0 BINDING ★ CARRIER EXACTNESS ★ CASE-FOLDED TICK ★ FIRST-DEPLOY-WINS ★ UTXO TOPOLOGY ★ INDEXER STATE ★ BITCOIN MAINNET ★ ";
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
          <span className="pill pill-pink animate-sparkle">mainnet</span>
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
          protocol :: dust-20@1.1.0 · network :: bitcoin-mainnet · status :: experimental ·
          consensus :: off-chain-index
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
          disclaimer † not bitcoin consensus · indexer-dependent state
        </p>
      </div>
      <div className="bg-[#070614] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-3xl text-sm text-[var(--ink-dim)]">
            SATDUST is a DUST-20 meta-protocol asset. Bitcoin Core does not interpret SATDUST
            balances. Validity is defined by confirmed transactions plus compatible indexer rules.
            Ecosystem support is limited. No guaranteed value, listing, or liquidity.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="pill pill-chrome">dust-20 1.1.0</span>
            <span className="pill pill-cyan">mainnet</span>
            <span className="pill pill-pink">experimental</span>
            <span className="pill pill-lime">sat-bound</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
