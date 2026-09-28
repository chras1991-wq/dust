import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@satdust/shared",
    "@satdust/dust20",
    "@satdust/quote",
    "@satdust/wallet",
    "@satdust/bitcoin",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' https://api.coinbase.com https://api.kraken.com https://www.bitstamp.net https://mempool.space https://blockstream.info; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
