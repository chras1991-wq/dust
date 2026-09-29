export function DustField() {
  const shards: Array<{
    top: string;
    left?: string;
    right?: string;
    w: number;
    h: number;
    bg: string;
    rot: string;
  }> = [
    { top: "8%", left: "4%", w: 120, h: 80, bg: "var(--c-orange)", rot: "-12deg" },
    { top: "18%", right: "6%", w: 90, h: 140, bg: "var(--c-magenta)", rot: "14deg" },
    { top: "55%", left: "8%", w: 70, h: 70, bg: "var(--c-cyan)", rot: "-8deg" },
    { top: "62%", right: "12%", w: 110, h: 60, bg: "var(--c-lime)", rot: "9deg" },
    { top: "30%", left: "55%", w: 50, h: 160, bg: "var(--c-yellow)", rot: "-18deg" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-[var(--c-magenta)] opacity-40 blur-3xl" />
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--c-orange)] opacity-35 blur-3xl" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-[var(--c-cyan)] opacity-30 blur-3xl" />
      {shards.map((s, i) => (
        <div
          key={i}
          className="collage-shard animate-floaty halftone"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            width: s.w,
            height: s.h,
            background: s.bg,
            ["--rot" as string]: s.rot,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={`p-${i}`}
          className="absolute font-stamp text-[0.65rem] opacity-40"
          style={{
            top: `${(i * 17) % 90}%`,
            left: `${(i * 29) % 95}%`,
            color: ["var(--c-yellow)", "var(--c-cyan)", "var(--c-lime)", "var(--c-magenta)"][
              i % 4
            ],
            transform: `rotate(${(i % 7) * 8 - 16}deg)`,
          }}
        >
          {["546", "SAT", "DUST", "★", "BTC", "UTXO"][i % 6]}
        </span>
      ))}
    </div>
  );
}

export function ProtocolDiagram() {
  return (
    <pre className="formula">{`Bitcoin Mainnet
   ║  collage of sats
   ▼
Inscription (DUST-20)
   ├── deploy { tick, supply, unit_sats, max_sats, lim_sats }
   └── mint   { tick, amt, sats }  @ carrier = sats, offset = 0
   ▼
UTXO / satoshi flow  (no separate transfer msg)
   ▼
Indexer → verified balance`}</pre>
  );
}

export function ParamTable() {
  const rows = [
    ["tick", "SATDUST", "Case-folded identity"],
    ["supply", "10000", "Permanent max units"],
    ["unit_sats", "546", "1 SATDUST = 546 sats"],
    ["max_sats", "5460000", "supply × unit_sats"],
    ["lim_sats", "546", "Max 1 unit / mint"],
    ["mint fee", "$7 ≡ BTC", "Project income"],
    ["backing", "546 sats", "Carrier UTXO"],
  ];

  return (
    <table className="table-spec">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Value</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b, c]) => (
          <tr key={a}>
            <td className="text-[var(--c-yellow)]">{a}</td>
            <td className="text-[var(--c-cyan)]">{b}</td>
            <td className="text-[var(--ink-dim)]">{c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CollageStampCloud() {
  const stamps = [
    { t: "10K SUPPLY", c: "sticker-orange", r: "-6deg" },
    { t: "1 PER MINT", c: "sticker-hot", r: "4deg" },
    { t: "546 SATS", c: "sticker-lime", r: "-2deg" },
    { t: "$7 FEE", c: "sticker-yellow", r: "7deg" },
    { t: "MAINNET", c: "sticker-cyan", r: "-5deg" },
    { t: "NO TEAM CUT", c: "sticker-hot", r: "3deg" },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {stamps.map((s) => (
        <span
          key={s.t}
          className={`sticker ${s.c} animate-pop`}
          style={{ ["--rot" as string]: s.r }}
        >
          {s.t}
        </span>
      ))}
    </div>
  );
}
