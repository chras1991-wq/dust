/**
 * Project payee resolution. Address lives in PROJECT_ADDRESS env (Vercel / .env.local).
 * Nothing sensitive is stored in the git tree.
 */
export function getProjectAddress(): string {
  const value = process.env.PROJECT_ADDRESS?.trim();
  if (!value || !/^bc1[a-z0-9]{25,87}$/i.test(value)) {
    throw new Error("PROJECT_ADDRESS is not configured");
  }
  return value;
}

export function assertProjectAddress(address: string): boolean {
  try {
    return address === getProjectAddress();
  } catch {
    return false;
  }
}
