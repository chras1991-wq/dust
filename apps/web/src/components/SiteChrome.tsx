"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROJECT_ADDRESS } from "@satdust/shared";

const LINKS = [
  { href: "/", label: "HOME", color: "sticker-orange", rot: "-3deg" },
  { href: "/mint", label: "MINT", color: "sticker-hot", rot: "2deg" },
  { href: "/explorer", label: "SCAN", color: "sticker-cyan", rot: "-1deg" },
  { href: "/verify", label: "CHECK", color: "sticker-lime", rot: "3deg" },
  { href: "/docs", label: "LORE", color: "sticker-yellow", rot: "-2deg" },
];

export function MarqueeBar() {
  const text =
    "SATDUST ★ BITCOIN DUST ★ CARRIED BY SATS ★ 10,000 ★ 546 SATS ★ $7 MINT ★ NO PREMINE ★ FAIR MINT ★ DUST-20 ★ MAINNET ★ ";
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
    <header className="layer relative border-b-4 border-[var(--c-black)] bg-[linear-gradient(90deg,#ff6a00,#ff2d95,#2ef2ff,#b8ff3c,#ffe14a)]">
      <div className="absolute inset-0 barcode opacity-20 mix-blend-multiply" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="no-underline">
            <span className="font-stamp text-3xl tracking-tight text-[var(--c-black)] drop-shadow-[3px_3px_0_#fff6e8]">
              SATDUST
            </span>
          </Link>
          <span className="sticker sticker-hot" style={{ ["--rot" as string]: "8deg" }}>
            LIVE DUST
          </span>
        </div>
        <nav className="flex flex-wrap gap-2">
          {LINKS.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`sticker ${l.color} no-underline ${active ? "scale-110" : "opacity-90"}`}
                style={{ ["--rot" as string]: l.rot }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="relative border-t-4 border-[var(--c-black)] bg-[var(--c-black)] px-4 py-2">
        <p className="mx-auto max-w-6xl overflow-x-auto font-mono text-[0.68rem] text-[var(--c-lime)]">
          FEE SINK → <span className="text-[var(--c-yellow)]">{PROJECT_ADDRESS}</span>
        </p>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="layer mt-10 border-t-4 border-[var(--c-black)]">
      <div className="bg-[var(--c-magenta)] px-4 py-3 font-stamp text-sm uppercase tracking-wider text-white">
        Risk dump † — experimental meta-protocol energy
      </div>
      <div className="bg-[var(--c-black)] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-3xl text-sm text-[var(--ink-dim)]">
            SATDUST rides experimental DUST-20. Not Bitcoin consensus. Bitcoin Core does not
            see SATDUST. Indexers decide state. Wallet / market support is thin. No guaranteed
            value, listing, liquidity, or return.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="sticker sticker-yellow" style={{ ["--rot" as string]: "-2deg" }}>
              DUST-20 1.1.0
            </span>
            <span className="sticker sticker-cyan" style={{ ["--rot" as string]: "3deg" }}>
              MAINNET
            </span>
            <span className="sticker sticker-hot" style={{ ["--rot" as string]: "-4deg" }}>
              EXPERIMENTAL
            </span>
            <span className="sticker sticker-lime" style={{ ["--rot" as string]: "2deg" }}>
              NO PREMINE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
