import "server-only";

/**
 * Server-only secrets. Never import from Client Components.
 * Missing QUOTE_SECRET in production aborts — no weak default ships live.
 */
export function getQuoteSecret(): string {
  const secret = process.env.QUOTE_SECRET?.trim();
  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (!secret) {
    if (isProd) {
      throw new Error("ABORT: QUOTE_SECRET is not configured");
    }
    return "satdust-dev-quote-secret-change-me";
  }

  if (isProd && secret.length < 32) {
    throw new Error("ABORT: QUOTE_SECRET must be at least 32 characters in production");
  }

  return secret;
}

export function getAdminToken(): string | null {
  const token = process.env.ADMIN_TOKEN?.trim();
  return token && token.length >= 16 ? token : null;
}

export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
  );
}
