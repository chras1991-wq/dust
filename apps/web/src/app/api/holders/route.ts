import { listMints } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

function maskAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Real Holder Top 10 from recorded mints only — no synthetic rows. */
export async function GET(req: Request) {
  const limited = rateLimit(req, "holders", 60, 60_000);
  if (limited) return limited;

  const tallies = new Map<string, number>();
  for (const m of listMints()) {
    if (!["DUST_VALID", "REVEAL_CONFIRMED", "INDEXER_PENDING"].includes(m.status)) {
      continue;
    }
    const key = m.walletAddress;
    if (!key) continue;
    tallies.set(key, (tallies.get(key) ?? 0) + (m.amount || 1));
  }

  const ranked = [...tallies.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([address, amount], i) => ({
      rank: i + 1,
      address: maskAddress(address),
      amount,
    }));

  const totalHeld = ranked.reduce((s, r) => s + r.amount, 0);

  return noStoreJson({
    holders: ranked,
    top10Total: totalHeld,
  });
}
