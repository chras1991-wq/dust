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
| Mint fee | $1 USD / SATDUST ≡ BTC |
| Project address | `bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4` |

## Monorepo

```
apps/web          Next.js site + API
packages/dust20   Deploy/mint validators
packages/quote    Signed BTC/USD quotes
packages/bitcoin  Reveal plan + status machine
packages/wallet   Bitcoin wallet adapters (browser wallets + Privy)
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
NEXT_PUBLIC_SITE_URL=https://dust20.com
NEXT_PUBLIC_PRIVY_APP_ID=cmt9hky9c01is0cjoiw60nprw
```

## Deploy (Vercel)

Root directory: **`apps/web`** (recommended). `apps/web/vercel.json` installs/builds from the monorepo root.

If production still shows the old Swap UI after merging to `main`, redeploy from the Vercel dashboard or set up a deploy hook — see [docs/vercel-deploy.md](docs/vercel-deploy.md).

Chain truth > database cache. Carrier output must be exactly 546 sats at inscription offset 0.
