import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Literata,
  Archivo,
  Archivo_Narrow,
  IBM_Plex_Mono,
} from "next/font/google";
import { PrivyRoot } from "@/components/PrivyRoot";
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
  title: "SATDUST Transfer — Bitcoin mainnet",
  description:
    "Standalone SATDUST transfer desk. Connect a Bitcoin wallet and send DUST-20 carrier inscriptions.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://satdust-transfer.vercel.app"
  ),
  robots: { index: true, follow: true },
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
        <PrivyRoot>
          <header className="layer border-b-[1.5px] border-[var(--ink)] bg-[var(--paper)]/95 pt-[env(safe-area-inset-top)]">
            <div className="page-shell flex flex-col gap-1 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="byline">Standalone · Bitcoin mainnet · DUST-20</p>
                <h1 className="masthead text-4xl text-[var(--accent)] sm:text-5xl">SATDUST Transfer</h1>
              </div>
              <p className="max-w-md text-sm text-[var(--ink-mute)]">
                Import or connect your BTC wallet. This site is separate from dust20.com.
              </p>
            </div>
          </header>
          <main className="layer min-h-[70vh]">{children}</main>
          <footer className="layer border-t border-[var(--ink)]/30 py-6 text-center text-xs text-[var(--ink-mute)]">
            Experimental transfer desk · English UI · Client bundles minified in production
          </footer>
        </PrivyRoot>
      </body>
    </html>
  );
}
