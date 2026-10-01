# Standalone SATDUST transfer portal (separate from dust20.com)

Deploy as its **own** Vercel project — do **not** merge into the main `@satdust/web` app.

## Vercel (recommended)

1. [Vercel Dashboard](https://vercel.com/new) → Import `chras1991-wq/dust`.
2. **Root Directory**: `apps/transfer-portal`
3. **Environment variables**:
   - `NEXT_PUBLIC_SITE_URL` = your new Vercel URL (e.g. `https://satdust-transfer.vercel.app`)
   - `INDEX_API_URL` = `https://dust20.com` (read-only index proxy)
   - `NEXT_PUBLIC_PRIVY_APP_ID` = same as main site (or your own Privy app)
4. Deploy. Production URL is your standalone transfer site.

`apps/transfer-portal/vercel.json` runs `npm install` and `npm run build -w @satdust/transfer-portal` from the monorepo root.

## Local

```bash
npm install
npm run build:transfer-portal
npm run start -w @satdust/transfer-portal
```

Open http://localhost:3001

## Code visibility

Production builds disable browser source maps and minify bundles (`next.config.ts`).
