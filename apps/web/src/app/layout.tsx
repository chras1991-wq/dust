import type { Metadata } from "next";
import { Newsreader, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SATDUST — Bitcoin Dust, Carried by Sats",
  description:
    "SATDUST is an experimental DUST-20 digital asset on Bitcoin Mainnet. 10,000 supply. 546 sats per unit. Fair mint.",
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
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
        style={
          {
            "--font-display": "var(--font-newsreader), serif",
            "--font-body": "var(--font-source-serif), serif",
            "--font-mono": "var(--font-ibm-plex-mono), monospace",
          } as React.CSSProperties
        }
      >
        <SiteHeader />
        <main className="paper min-h-[70vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
