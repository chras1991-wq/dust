export function ProtocolDiagram() {
  return (
    <pre className="formula">{`Bitcoin mainnet tx
   │
   ▼
Inscription (commit → reveal)
   │  dust-20 mint JSON
   ▼
Carrier UTXO
   │  value == declared sats
   │  inscription offset == 0
   ▼
Indexer accept
   → SATDUST + spendable sats
   ▼
Transfer = spend the carrier`}</pre>
  );
}

export function ParamTable() {
  const rows = [
    ["p", "dust-20", "Protocol"],
    ["tick", "SATDUST", "Ticker (case ignored)"],
    ["supply", "10000", "Max mintable units"],
    ["unit_sats", "546", "Sats per unit"],
    ["max_sats", "5460000", "supply × unit_sats"],
    ["lim_sats", "546", "Per-mint sats cap"],
  ];

  return (
    <table className="table-spec">
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b, c]) => (
          <tr key={a}>
            <td className="font-mono text-[var(--accent)]">{a}</td>
            <td className="font-mono">{b}</td>
            <td className="text-[var(--ink-mute)]">{c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EditorialAside() {
  return (
    <aside className="panel-edit slant-block-r">
      <p className="kicker">Carrier</p>
      <p className="font-display mt-3 text-2xl italic leading-snug">
        Asset on the inscription. Liquidity in the sats. Same output.
      </p>
      <p className="byline mt-4">What you hold after mint</p>
    </aside>
  );
}
