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

function mulberry(seed: number): number {
  let a = seed >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randInt(seed: number, min: number, max: number): number {
  return min + Math.floor(mulberry(seed) * (max - min + 1));
}

function syntheticAddress(seed: number): string {
  const hex = Array.from({ length: 8 }, (_, i) =>
    Math.floor(mulberry(seed + i * 17) * 16).toString(16)
  ).join("");
  return `bc1q${hex}…${String(seed % 10000).padStart(4, "0")}`;
}

function aggregateRealHolders(): { address: string; amount: number }[] {
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
    "PSBT_CREATED",
  ]);
  for (const m of listMints()) {
    if (!credited.has(m.status)) continue;
    map.set(m.walletAddress, (map.get(m.walletAddress) ?? 0) + m.amount);
  }
  return [...map.entries()]
    .map(([address, amount]) => ({ address, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Smooth top-10 curve: early project = dozens of minters, #10 still holds a meaningful bag.
 * Top-10 total ≈ 32–38% of displayed mint progress.
 */
function syntheticTop10Amounts(displayMinted: number): number[] {
  const seed = Math.floor(displayMinted / 13) + 7;
  const targetSum = Math.round(displayMinted * (0.32 + mulberry(seed) * 0.06));

  const whalePhase = displayMinted >= 3600;
  const top1Cap = whalePhase
    ? Math.min(Math.round(displayMinted * 0.11), 580)
    : Math.round(displayMinted * 0.09);
  const top1 = Math.max(
    whalePhase ? 160 : 12,
    Math.min(
      top1Cap,
      Math.round(
        targetSum *
          (whalePhase ? 0.22 + mulberry(seed + 1) * 0.05 : 0.17 + mulberry(seed + 1) * 0.05)
      )
    )
  );
  const rank10Floor = Math.max(
    whalePhase ? Math.round(top1 * 0.35) : 8,
    Math.round(top1 * (0.52 + mulberry(seed + 2) * 0.1))
  );

  const raw: number[] = [];
  for (let rank = 1; rank <= 10; rank++) {
    const t = (rank - 1) / 9;
    const eased = 1 - (1 - t) ** 1.12;
    const base = top1 - (top1 - rank10Floor) * eased;
    const jitter = randInt(seed + rank * 31, -3, 4);
    raw.push(Math.max(rank10Floor, Math.round(base + jitter)));
  }

  raw.sort((a, b) => b - a);
  const sum = raw.reduce((s, n) => s + n, 0);
  const scale = targetSum / sum;
  const scaled = raw.map((n, i) => {
    const v = Math.round(n * scale);
    if (i === 9) return Math.max(rank10Floor, v);
    const minForRank = Math.round(rank10Floor + (9 - i) * 2.2);
    return Math.max(minForRank, v);
  });
  scaled.sort((a, b) => b - a);

  const fixSum = scaled.reduce((s, n) => s + n, 0);
  if (fixSum > targetSum * 1.04) {
    const trim = (fixSum - targetSum) / 10;
    for (let i = 0; i < 10; i++) {
      const floor = i === 9 ? rank10Floor : Math.round(rank10Floor + (9 - i) * 2);
      scaled[i] = Math.max(floor, Math.round(scaled[i] - trim));
    }
  }
  scaled.sort((a, b) => b - a);
  return scaled;
}

/** Top 10 holders; distribution matches early-stage mint (tens of wallets, not #10 = 1). */
export function buildHolderTop10(realMinted: number): HolderRow[] {
  const { displayMinted } = displayMintProgress(realMinted);
  const amounts = syntheticTop10Amounts(displayMinted);
  const real = aggregateRealHolders();

  const rows: { address: string; amount: number; synthetic: boolean }[] = [];
  let seed = Math.floor(displayMinted / 11) + 99;

  for (let i = 0; i < 10; i++) {
    const realAt = real[i];
    if (realAt && realAt.amount >= amounts[i] * 0.85) {
      rows.push({
        address: realAt.address,
        amount: Math.max(amounts[i], realAt.amount),
        synthetic: false,
      });
    } else {
      rows.push({
        address: syntheticAddress(seed),
        amount: amounts[i],
        synthetic: true,
      });
      seed += 97;
    }
  }

  rows.sort((a, b) => b.amount - a.amount);

  return rows.map((r, i) => ({
    rank: i + 1,
    address: shortenAddress(r.address),
    amount: r.amount,
    synthetic: r.synthetic,
  }));
}
