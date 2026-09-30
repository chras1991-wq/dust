import "server-only";
import { listMints } from "@/lib/store";
import { displayMintProgress } from "@/lib/virtual-progress";

export type HolderRow = {
  rank: number;
  address: string;
  amount: number;
  synthetic: boolean;
};

const NICE_MINT_BAGS = [
  5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500,
];

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

function pickNiceBag(seed: number, target: number, cap: number): number {
  const t = Math.min(cap, Math.max(5, Math.round(target)));
  let best = NICE_MINT_BAGS[0]!;
  let bestDist = Math.abs(best - t);
  for (const n of NICE_MINT_BAGS) {
    if (n > cap) continue;
    const d = Math.abs(n - t);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  const idx = NICE_MINT_BAGS.indexOf(best);
  const shift = randInt(seed + 3, -2, 2);
  const pick = NICE_MINT_BAGS[Math.max(0, Math.min(NICE_MINT_BAGS.length - 1, idx + shift))]!;
  return Math.min(cap, pick);
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

/** Top-10 bags use round mint sizes; ranks are uneven, not arithmetic -2 steps. */
function syntheticTop10Amounts(displayMinted: number): number[] {
  const seed = Math.floor(displayMinted / 19) + 11;
  const targetSum = Math.round(displayMinted * (0.32 + mulberry(seed) * 0.06));
  const whalePhase = displayMinted >= 3600;
  const topCap = whalePhase ? Math.min(580, Math.round(displayMinted * 0.12)) : Math.round(displayMinted * 0.1);

  const weights = [1, 0.82, 0.68, 0.55, 0.46, 0.38, 0.31, 0.26, 0.22, 0.18];
  const raw: number[] = [];
  for (let i = 0; i < 10; i++) {
    const rough = (targetSum / 6.2) * weights[i]! * (0.75 + mulberry(seed + i * 53) * 0.55);
    raw.push(pickNiceBag(seed + i * 101, rough, Math.max(8, topCap)));
  }

  raw.sort((a, b) => b - a);

  for (let i = 1; i < raw.length; i++) {
    if (raw[i]! >= raw[i - 1]!) {
      const lower = pickNiceBag(seed + i * 7, raw[i - 1]! * 0.72, raw[i - 1]! - 1);
      raw[i] = Math.max(5, Math.min(raw[i]!, lower));
    }
    if (i > 1 && raw[i - 1]! - raw[i]! === 2) {
      raw[i] = Math.max(5, raw[i]! - randInt(seed + i, 3, 11));
      if (!NICE_MINT_BAGS.includes(raw[i]!)) {
        raw[i] = pickNiceBag(seed + i * 13, raw[i]!, raw[i - 1]! - 1);
      }
    }
  }

  const sum = raw.reduce((s, n) => s + n, 0);
  if (sum > targetSum * 1.08) {
    const trimEach = Math.ceil((sum - targetSum) / 10);
    for (let i = 0; i < 10; i++) {
      raw[i] = Math.max(5, raw[i]! - trimEach);
    }
  }

  raw.sort((a, b) => b - a);
  return raw;
}

/** Top 10 holders; round-number bags, organic spacing. */
export function buildHolderTop10(realMinted: number): HolderRow[] {
  const { displayMinted } = displayMintProgress(realMinted);
  const amounts = syntheticTop10Amounts(displayMinted);
  const real = aggregateRealHolders();

  const rows: { address: string; amount: number; synthetic: boolean }[] = [];
  let seed = Math.floor(displayMinted / 11) + 99;

  for (let i = 0; i < 10; i++) {
    const realAt = real[i];
    if (realAt && realAt.amount >= amounts[i]! * 0.85) {
      rows.push({
        address: realAt.address,
        amount: Math.max(amounts[i]!, realAt.amount),
        synthetic: false,
      });
    } else {
      rows.push({
        address: syntheticAddress(seed),
        amount: amounts[i]!,
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
