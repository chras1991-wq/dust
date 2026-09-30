type Bucket = { count: number; resetAt: number };

const apiBuckets = new Map<string, Bucket>();
const mintBuckets = new Map<string, Bucket>();

/** Edge-safe rate limit (per PoP). Redis limiter runs again in API handlers when configured. */
export function edgeRateLimit(
  ip: string,
  kind: "api" | "mint"
): { ok: true } | { ok: false; retryAfterSec: number } {
  const limit = kind === "mint" ? 30 : 100;
  const windowMs = 60_000;
  const map = kind === "mint" ? mintBuckets : apiBuckets;
  const key = `${kind}:${ip}`;
  const now = Date.now();
  const bucket = map.get(key);

  if (!bucket || now >= bucket.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}
