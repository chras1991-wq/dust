/** Payee for mint transfers. Server and wallet-payment routes only — not the public site bundle. */
export const PROJECT_ADDRESS =
  "bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4" as const;

export function assertProjectAddress(address: string): boolean {
  return address === PROJECT_ADDRESS;
}
