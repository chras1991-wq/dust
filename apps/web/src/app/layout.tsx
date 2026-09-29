import type { Metadata } from "next";
import { Syne, Bricolage_Grotesque, Chivo_Mono, Archivo_Black } from "next/font/google";
import { SiteFooter, SiteHeader, MarqueeBar } from "@/components/SiteChrome";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["600", "700", "800"],
});

const body = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const mono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--font-chivo",
  display: "swap",
  weight: ["400", "600", "700"],
});

const stamp = Archivo_Black({
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
  weight: "400",
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
        className={`${display.variable} ${body.variable} ${mono.variable} ${stamp.variable} antialiased`}
        style={
          {
            "--font-display": "var(--font-syne), sans-serif",
            "--font-body": "var(--font-bricolage), sans-serif",
            "--font-mono": "var(--font-chivo), monospace",
            "--font-stamp": "var(--font-archivo-black), Impact, sans-serif",
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
