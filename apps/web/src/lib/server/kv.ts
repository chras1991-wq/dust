import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** Shared Redis (Vercel KV / Upstash). When unset, API falls back to per-instance memory. */
export function getKv(): Redis | null {
  if (client !== undefined) return client;

  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    "";

  if (!url || !token) {
    client = null;
    return client;
  }

  client = new Redis({ url, token });
  return client;
}

export function kvEnabled(): boolean {
  return getKv() !== null;
}
