# Secrets and production config

**Do not commit** payee addresses, API secrets, or tokens to GitHub.

| Variable | Where to set | In git? |
|----------|----------------|---------|
| `PROJECT_ADDRESS` | Vercel + local `.env.local` | No |
| `SWAP_POOL_ADDRESS` | Vercel + local `.env.local` | No |
| `QUOTE_SECRET` | Vercel + local `.env.local` | No |
| `ADMIN_TOKEN` | Vercel + local `.env.local` | No |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Vercel (build-time) | No |
| `KV_REST_API_*` | Vercel | No |

Copy `apps/web/.env.example` → `apps/web/.env.local` for local development only.

Vercel deploys read **only** from the Vercel environment — not from the repository.
