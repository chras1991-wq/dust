import "server-only";

const DEFAULT_POOL_ADDRESS =
  "bc1p38qcv00xqd4rsfch4z3ulp67vnv7j95qdy009kccf3y2pxurxxpqt8h9mr";

/** Pool payout address — server-only; set SWAP_POOL_ADDRESS in production env. */
export function getSwapPoolAddress(): string {
  const fromEnv = process.env.SWAP_POOL_ADDRESS?.trim();
  return fromEnv && /^bc1[a-z0-9]{25,87}$/i.test(fromEnv) ? fromEnv : DEFAULT_POOL_ADDRESS;
}
