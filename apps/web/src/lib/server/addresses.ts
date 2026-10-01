import "server-only";

function readBech32Env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || !/^bc1[a-z0-9]{25,87}$/i.test(value)) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

/** Mint / project payee — set PROJECT_ADDRESS in Vercel only, never commit. */
export function getProjectAddress(): string {
  return readBech32Env("PROJECT_ADDRESS");
}

/** Swap pool treasury — set SWAP_POOL_ADDRESS in Vercel only, never commit. */
export function getSwapPoolAddress(): string {
  return readBech32Env("SWAP_POOL_ADDRESS");
}
