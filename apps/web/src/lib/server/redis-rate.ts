import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { getKv } from "@/lib/server/kv";

let mintLimiter: Ratelimit | null | undefined;
let apiLimiter: Ratelimit | null | undefined;

function build() {
  const kv = getKv();
  if (!kv) {
    mintLimiter = null;
    apiLimiter = null;
    return;
  }
  apiLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(200, "60 s"),
    prefix: "satdust:rl:api",
  });
  mintLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(40, "60 s"),
    prefix: "satdust:rl:mint",
  });
}

export async function redisRateLimit(
  ip: string,
  kind: "api" | "mint"
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  if (mintLimiter === undefined) build();
  const limiter = kind === "mint" ? mintLimiter : apiLimiter;
  if (!limiter) return { ok: true };

  const res = await limiter.limit(ip);
  if (res.success) return { ok: true };
  return {
    ok: false,
    retryAfterSec: Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
  };
}
