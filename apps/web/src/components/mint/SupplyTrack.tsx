type Tick = {
  id: string;
  title: string;
  supplyAfter: number;
  status: string;
};

export function SupplyTrack({
  minted,
  total,
  ticks,
}: {
  minted: number;
  total: number;
  ticks: Tick[];
}) {
  const pct = Math.min(100, (minted / total) * 100);

  return (
    <section className="mt-14 sm:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="byline">04 · Total supply</p>
          <h2 className="font-display mt-1 text-2xl sm:text-3xl">Issuance track</h2>
        </div>
        <p className="font-mono text-sm text-[var(--accent)]">
          {minted.toLocaleString()} / {total.toLocaleString()}
        </p>
      </div>

      <div className="relative mt-8">
        <div className="h-2 w-full bg-[rgba(17,17,17,0.12)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--paper)] bg-[var(--accent)]"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
        <div className="mt-4 flex justify-between gap-1 overflow-x-auto scroll-x pb-1">
          {ticks.map((t) => {
            const done = t.status === "MINTED";
            const active = t.status === "IN_PROGRESS" || t.status === "REACHED" || t.status === "VOTING";
            return (
              <div key={t.id} className="min-w-[3.2rem] shrink-0 text-center">
                <p
                  className={`font-mono text-[0.65rem] ${
                    done || active ? "text-[var(--ink)]" : "text-[var(--ink-mute)]"
                  }`}
                >
                  {t.supplyAfter.toLocaleString()}
                </p>
                <p
                  className={`mt-0.5 font-condensed text-[0.58rem] uppercase tracking-[0.08em] ${
                    active ? "text-[var(--accent)]" : "text-[var(--ink-mute)]"
                  }`}
                >
                  {t.title.split(" ")[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
