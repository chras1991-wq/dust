# SATDUST

Bitcoin Dust. Carried by Sats.

Experimental **DUST-20** (v1.1.0, 2026-09-01) asset on Bitcoin Mainnet.

| Parameter | Value |
|-----------|-------|
| Ticker | SATDUST |
| Supply | 54,600 |
| Genesis | 5,460 |
| unit_sats | 546 |
| max_sats | 29,811,600 |
| lim_sats | 546 |
| Mint fee | $7 USD ≡ BTC |
| Project address | `bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4` |

## Monorepo

```
apps/web          Next.js site + API
packages/dust20   Deploy/mint validators
packages/quote    Signed BTC/USD quotes
packages/bitcoin  Reveal plan + status machine
packages/wallet   UniSat / OKX / Xverse / Leather adapters
packages/shared   Constants
```

## Develop

```bash
npm install
npm run dev
npm test
```

## Environment

```
QUOTE_SECRET=...
DEPLOY_TXID=
DEPLOY_INSCRIPTION_ID=
BTC_USD_FALLBACK=100000
NEXT_PUBLIC_SITE_URL=https://your-deployment.vercel.app
```

## Deploy (Vercel)

Root directory: `apps/web` (or use `vercel.json` at repo root).

Chain truth > database cache. Carrier output must be exactly 546 sats at inscription offset 0.
