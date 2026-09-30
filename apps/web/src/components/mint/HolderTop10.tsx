"use client";

type Holder = {
  rank: number;
  address: string;
  amount: number;
};

type Props = {
  holders: Holder[];
  loading?: boolean;
};

export function HolderTop10({ holders, loading }: Props) {
  return (
    <section className="panel-edit mt-8">
      <h2 className="font-display text-xl tracking-tight sm:text-2xl">Holder Top 10</h2>
      {loading ? (
        <p className="mt-4 text-sm text-[var(--ink-mute)]">Loading…</p>
      ) : holders.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-mute)]">No holders yet.</p>
      ) : (
        <ol className="mt-4 divide-y divide-[var(--rule)] font-sans text-sm">
          {holders.map((h) => (
            <li key={h.rank} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-condensed text-[0.7rem] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
                #{h.rank}
              </span>
              <span className="min-w-0 flex-1 font-mono text-xs text-[var(--ink-soft)]">
                {h.address}
              </span>
              <span className="font-display text-base tabular-nums text-[var(--ink)]">
                {h.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
