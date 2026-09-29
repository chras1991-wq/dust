import type { Metadata } from "next";
import { Orbitron, Comfortaa, Press_Start_2P, VT323 } from "next/font/google";
import { SiteFooter, SiteHeader, MarqueeBar } from "@/components/SiteChrome";
import "./globals.css";

const display = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["500", "700", "800", "900"],
});

const body = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  display: "swap",
});

const pixel = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
  weight: "400",
});

const mono = VT323({
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "SATDUST — Bitcoin Dust, Carried by Sats",
  description:
    "SATDUST — sat-bound DUST-20 meta-protocol asset on Bitcoin Mainnet. Inscription predicates, exact carrier invariants, indexer state.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://satdust.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${pixel.variable} ${mono.variable} antialiased`}
        style={
          {
            "--font-display": "var(--font-orbitron), sans-serif",
            "--font-body": "var(--font-comfortaa), sans-serif",
            "--font-pixel": "var(--font-press-start), monospace",
            "--font-mono": "var(--font-vt323), monospace",
          } as React.CSSProperties
        }
      >
        <MarqueeBar />
        <SiteHeader />
        <main className="layer min-h-[70vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
