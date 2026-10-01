import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP: fonts are self-hosted via next/font — no Google Fonts CDN at runtime.
 * connect-src allows mempool.space plus Privy and WalletConnect.
 * script-src keeps unsafe-inline for Next hydration; no unsafe-eval in prod.
 */
const CSP = [
  "default-src 'self'",
  isProd
    ? "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://auth.privy.io https://explorer-api.walletconnect.com https://registry.walletconnect.com",
  // mempool.space: commit lookup + reveal broadcast. Privy + WalletConnect: wallet login.
  "connect-src 'self' https://mempool.space https://auth.privy.io https://api.privy.io https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://verify.walletconnect.com https://verify.walletconnect.org https://pulse.walletconnect.org https://api.web3modal.org wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org",
  "frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com",
  "child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  reactStrictMode: true,
  transpilePackages: [
    "@satdust/shared",
    "@satdust/dust20",
    "@satdust/quote",
    "@satdust/wallet",
    "@satdust/bitcoin",
  ],
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: ["@satdust/shared"],
  },
  async redirects() {
    return [
      { source: "/mint", destination: "/explorer", permanent: false },
      { source: "/mint/:path*", destination: "/explorer", permanent: false },
    ];
  },
  webpack: (config, { dev, isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        buffer: require.resolve('buffer/'),
        stream: false,
        crypto: false,
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    // Never emit browser source maps in production (anti-RE / no source leak).
    if (!dev) {
      config.devtool = false;
    }
    // Keep server bundles out of client graph hints.
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: "deterministic",
        chunkIds: "deterministic",
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Allow wallet and Privy auth popups
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
