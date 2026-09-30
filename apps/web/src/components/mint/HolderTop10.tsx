"use client";

import { useEffect, useState } from "react";

type Holder = {
  rank: number;
  address: string;
  amount: number;
};

export function HolderTop10() {
  const [holders, setHolders] = useState<Holder[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void fetch("/api/holders")
        .then((r) => r.json())
        .then((d: { holders?: Holder[] }) => {
          if (alive) setHolders(d.holders ?? []);
        })
        .catch(() => {
          if (alive) setHolders([]);
        });
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="mt-10 border-t-[1.5px] border-[var(--ink)] pt-8">
      <p className="byline">Board</p>
      <h2 className="font-display mt-1 text-2xl sm:text-3xl">Holder Top 10</h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--ink-mute)]">
        Ranked by confirmed mint amount. Addresses masked.
      </p>
      <div className="scroll-x mt-5">
        <table className="table-spec min-w-[20rem]">
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {holders.length ? (
              holders.map((h) => (
                <tr key={`${h.rank}-${h.address}`}>
                  <td className="font-mono">{String(h.rank).padStart(2, "0")}</td>
                  <td className="font-mono text-sm">{h.address}</td>
                  <td className="text-right font-mono">{h.amount.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-[var(--ink-mute)]">
                  No holders yet — first mints appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
