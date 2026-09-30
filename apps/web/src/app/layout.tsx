import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Literata,
  Archivo,
  Archivo_Narrow,
  IBM_Plex_Mono,
} from "next/font/google";
import { SiteFooter, SiteHeader, MarqueeBar } from "@/components/SiteChrome";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});

const body = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const condensed = Archivo_Narrow({
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SATDUST — DUST-20 on Bitcoin Mainnet",
  description:
    "DUST-20 is the first Bitcoin-native protocol that constructs liquidity UTXOs. SATDUST is the opening ticker.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://satdust.vercel.app"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f3f1ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${sans.variable} ${condensed.variable} ${mono.variable} antialiased`}
        style={
          {
            "--font-display": "var(--font-playfair), serif",
            "--font-body": "var(--font-literata), serif",
            "--font-sans": "var(--font-archivo), sans-serif",
            "--font-condensed": "var(--font-archivo-narrow), sans-serif",
            "--font-mono": "var(--font-ibm-plex), monospace",
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
