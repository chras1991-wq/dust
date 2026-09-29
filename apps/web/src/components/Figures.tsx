export function DustField() {
  const orbs: Array<{
    top: string;
    left?: string;
    right?: string;
    size: number;
    color: string;
    delay: string;
  }> = [
    { top: "10%", left: "8%", size: 140, color: "#ff4ecb", delay: "0s" },
    { top: "20%", right: "10%", size: 110, color: "#41f3ff", delay: "0.6s" },
    { top: "60%", left: "15%", size: 90, color: "#c6ff4d", delay: "1.2s" },
    { top: "55%", right: "18%", size: 160, color: "#b388ff", delay: "0.3s" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <div
          key={i}
          className="orb"
          style={{
            top: o.top,
            left: o.left,
            right: o.right,
            width: o.size,
            height: o.size,
            ["--orb" as string]: o.color,
            animationDelay: o.delay,
          }}
        />
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={`s-${i}`}
          className="absolute animate-sparkle text-[var(--cyan)]"
          style={{
            top: `${(i * 13) % 90}%`,
            left: `${(i * 23) % 95}%`,
            fontSize: i % 2 === 0 ? 10 : 14,
            animationDelay: `${i * 0.15}s`,
            color: ["#ff4ecb", "#41f3ff", "#c6ff4d", "#fff"][i % 4],
          }}
        >
          ✦
        </span>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={`b-${i}`}
          className="absolute rounded-full border border-white/40 bg-gradient-to-br from-white/40 to-transparent"
          style={{
            left: `${10 + i * 11}%`,
            bottom: "-20px",
            width: 10 + (i % 3) * 8,
            height: 10 + (i % 3) * 8,
            animation: `bubble ${8 + (i % 5)}s linear infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ProtocolDiagram() {
  return (
    <pre className="formula">{`Bitcoin Mainnet
   │  chrome rails
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
            <td className="text-[var(--pink)]">{a}</td>
            <td className="text-[var(--cyan)]">{b}</td>
            <td className="text-[var(--ink-dim)]">{c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CollageStampCloud() {
  const stamps = [
    { t: "10k supply", c: "pill-pink" },
    { t: "1 per mint", c: "pill-cyan" },
    { t: "546 sats", c: "pill-lime" },
    { t: "$7 fee", c: "pill-chrome" },
    { t: "mainnet", c: "pill-cyan" },
    { t: "no team cut", c: "pill-pink" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {stamps.map((s) => (
        <span key={s.t} className={`pill ${s.c}`}>
          {s.t}
        </span>
      ))}
    </div>
  );
}
