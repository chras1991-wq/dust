export function DustField() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 12) * 0.7}s`,
    duration: `${10 + (i % 8)}s`,
    size: i % 3 === 0 ? 3 : 2,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="dust-particle"
          style={{
            left: p.left,
            bottom: "-4px",
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

export function ProtocolDiagram() {
  return (
    <pre className="formula text-[0.72rem] leading-relaxed">{`Bitcoin Mainnet
      │
      ▼
Inscription (DUST-20 meta-protocol)
      │
      ├── deploy { tick, supply, unit_sats, max_sats, lim_sats }
      └── mint   { tick, amt, sats }  @ carrier output = sats, offset = 0
      │
      ▼
UTXO / satoshi flow  (no separate transfer message)
      │
      ▼
Compatible DUST-20 indexer  →  verified balance`}</pre>
  );
}

export function ParamTable() {
  const rows = [
    ["tick", "SATDUST", "Case-folded identity"],
    ["supply", "10000", "Permanent maximum units"],
    ["unit_sats", "546", "1 SATDUST = 546 sats"],
    ["max_sats", "5460000", "supply × unit_sats"],
    ["lim_sats", "546", "Max sats per mint (= 1 unit)"],
    ["mint fee", "$7 ≡ BTC", "Project income; not backing"],
    ["backing", "546 sats", "Carrier UTXO; not project income"],
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
            <td className="text-[var(--accent)]">{a}</td>
            <td>{b}</td>
            <td className="text-[var(--ink-dim)]">{c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
