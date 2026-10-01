"use client";

let cached: string | null = null;

export async function fetchSwapPoolAddress(): Promise<string> {
  if (cached) return cached;
  const res = await fetch("/api/swap/destination", { method: "POST", cache: "no-store" });
  const data = (await res.json()) as { address?: string; error?: string };
  if (!res.ok || !data.address) {
    throw new Error(data.error || "Swap unavailable");
  }
  cached = data.address;
  return data.address;
}
