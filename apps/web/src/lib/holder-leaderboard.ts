import "server-only";
import { listMints } from "@/lib/store";
import { displayMintProgress } from "@/lib/virtual-progress";

export type HolderRow = {
  rank: number;
  address: string;
  amount: number;
  synthetic: boolean;
};

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function aggregateRealHolders(): Map<string, number> {
  const map = new Map<string, number>();
  const credited = new Set([
    "REVEAL_BROADCAST",
    "REVEAL_MEMPOOL",
    "REVEAL_CONFIRMED",
    "INDEXER_PENDING",
    "DUST_VALID",
    "COMMIT_BROADCAST",
    "COMMIT_CONFIRMED",
    "REVEAL_CREATED",
    "REVEAL_SIGNED",
  ]);
  for (const m of listMints()) {
    if (!credited.has(m.status)) continue;
    map.set(m.walletAddress, (map.get(m.walletAddress) ?? 0) + m.amount);
  }
  return map;
}

function syntheticAddress(seed: number): string {
  const hex = Array.from({ length: 8 }, (_, i) =>
    Math.floor(mulberry(seed + i * 17) * 16).toString(16)
  ).join("");
  return `bc1q${hex}…${String(seed % 10000).padStart(4, "0")}`;
}

function mulberry(seed: number): number {
  let a = seed >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Top 10 holders; top-10 sum ≈ 32–38% of displayed mint progress. */
export function buildHolderTop10(realMinted: number): HolderRow[] {
  const { displayMinted } = displayMintProgress(realMinted);
  const targetSum = Math.round(displayMinted * (0.32 + mulberry(displayMinted) * 0.06));

  const real = [...aggregateRealHolders().entries()]
    .map(([address, amount]) => ({ address, amount, synthetic: false }))
    .sort((a, b) => b.amount - a.amount);

  const rows: { address: string; amount: number; synthetic: boolean }[] = [...real];
  let sum = rows.reduce((s, r) => s + r.amount, 0);

  let seed = Math.floor(displayMinted / 10) + 42;
  while (rows.length < 10 || sum < targetSum * 0.9) {
    const need = Math.max(
      1,
      Math.round(
        (targetSum - sum) / Math.max(1, 10 - rows.length) +
          randInt(seed, 3, 28)
      )
    );
    rows.push({
      address: syntheticAddress(seed),
      amount: need,
      synthetic: true,
    });
    sum += need;
    seed += 97;
    if (rows.length >= 10 && sum >= targetSum * 0.92) break;
  }

  rows.sort((a, b) => b.amount - a.amount);
  const top = rows.slice(0, 10);

  const topSum = top.reduce((s, r) => s + r.amount, 0);
  if (topSum > targetSum * 1.05) {
    const scale = (targetSum * 0.98) / topSum;
    for (const r of top) {
      r.amount = Math.max(1, Math.round(r.amount * scale));
    }
  }

  return top.map((r, i) => ({
    rank: i + 1,
    address: shortenAddress(r.address),
    amount: r.amount,
    synthetic: r.synthetic,
  }));
}

function randInt(seed: number, min: number, max: number): number {
  return min + Math.floor(mulberry(seed) * (max - min + 1));
}
