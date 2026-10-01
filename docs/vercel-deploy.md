# Deploy to Vercel (dust20.com)

`main` includes the live Swap desk. If **dust20.com** still shows “Migrates when the first mint batch completes”, production has **not** picked up the latest deployment.

## Quick fix (dashboard)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project for **dust20.com**.
2. **Settings → Git**: confirm repo `chras1991-wq/dust`, production branch **`main`**, auto-deploy **enabled**.
3. **Settings → General → Root Directory**: set to **`apps/web`** (monorepo).  
   `apps/web/vercel.json` runs `npm install` / `npm run build -w @satdust/web` from the repo root.
4. **Deployments** → latest **main** → **Redeploy** (uncheck “Use existing Build Cache” if offered).
5. Wait until status is **Ready**, then hard-refresh `/explorer` on mobile (or clear site data).

## Verify

Open `/explorer` source or the explorer page chunk; you should see **Connect Wallet** and **Swap SATDUST → BTC**, not the disabled migration button on the swap panel.

## Optional: deploy hook (CI)

1. Vercel → **Settings → Git → Deploy Hooks** → create hook for **Production** / branch `main`.
2. GitHub repo → **Settings → Secrets → Actions** → `VERCEL_DEPLOY_HOOK` = hook URL.
3. Pushes to `main` will call `.github/workflows/vercel-deploy-hook.yml`.

## Environment

See root `README.md` for `QUOTE_SECRET`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_SITE_URL=https://dust20.com`.
