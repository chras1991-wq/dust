/** Pure merge: real wallets always rank by true balance; synthetics fill gaps below them. */

export type HolderEntry = {
  address: string;
  amount: number;
  synthetic: boolean;
};

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

/** Enforce rank #1 >= #2 >= …; synthetics never outrank a real with higher balance. */
export function enforceDescending(entries: HolderEntry[], seed: number): HolderEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    if (a.synthetic !== b.synthetic) return a.synthetic ? 1 : -1;
    return 0;
  });

  const out = sorted.map((e) => ({ ...e }));
  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1]!.amount;
    if (out[i]!.amount > prev) {
      if (out[i]!.synthetic) {
        out[i]!.amount = Math.max(1, prev - randInt(seed + i * 17, 1, Math.min(12, Math.max(1, prev - 1))));
      } else {
        out[i - 1]!.amount = out[i]!.amount;
      }
    }
    if (out[i]!.synthetic && out[i]!.amount >= prev) {
      out[i]!.amount = Math.max(1, prev - 1);
    }
  }
  return out;
}

/**
 * Reals use exact on-chain balances and take top slots by amount.
 * Synthetics only fill remaining slots, each strictly below the row above.
 */
export function mergeTop10Holders(args: {
  reals: { address: string; amount: number }[];
  syntheticLadder: number[];
  syntheticAddress: (seed: number) => string;
  seed: number;
}): HolderEntry[] {
  const { reals, syntheticLadder, syntheticAddress, seed } = args;
  const sortedReals = [...reals].sort((a, b) => b.amount - a.amount).slice(0, 10);
  const ladder = [...syntheticLadder].sort((a, b) => b - a);

  const out: HolderEntry[] = sortedReals.map((r) => ({
    address: r.address,
    amount: r.amount,
    synthetic: false,
  }));

  let ladderIdx = 0;
  let addrSeed = seed;

  while (out.length < 10) {
    const prev = out[out.length - 1]?.amount ?? Number.POSITIVE_INFINITY;
    let cap = Number.isFinite(prev) ? prev - 1 : ladder[0] ?? 100;
    if (cap < 1) cap = 1;

    let amt = ladder[ladderIdx] ?? ladder[ladder.length - 1] ?? 10;
    ladderIdx += 1;
    if (amt > cap) amt = cap;
    if (amt < 1) amt = 1;

    out.push({
      address: syntheticAddress(addrSeed),
      amount: amt,
      synthetic: true,
    });
    addrSeed += 97;
  }

  return enforceDescending(out, seed);
}
