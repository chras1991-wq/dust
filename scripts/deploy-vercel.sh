#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN (https://vercel.com/account/tokens)" >&2
  exit 1
fi

export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

npx vercel@41.6.0 deploy --prod --yes --token "$VERCEL_TOKEN"
