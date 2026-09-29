export function ProtocolDiagram() {
  return (
    <pre className="formula">{`Bitcoin mainnet tx
   │
   ▼
Inscription (commit → reveal)
   │  dust-20 mint JSON
   ▼
Mint UTXO
   │  value == declared sats
   │  inscription offset == 0
   ▼
Indexer accept
   → SATDUST + spendable sats
   ▼
Transfer = spend that UTXO`}</pre>
  );
}

export function ParamTable() {
  const rows = [
    ["p", "dust-20", "Protocol"],
    ["tick", "SATDUST", "Ticker (case ignored)"],
    ["supply", "54600", "Max mintable units"],
    ["unit_sats", "546", "Sats per unit"],
    ["max_sats", "29811600", "supply × unit_sats"],
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
      <p className="kicker">L1 inventory</p>
      <p className="font-display mt-3 text-2xl italic leading-snug">
        A UTXO-shaped token built to seed BTC L1 swap inventory.
      </p>
      <p className="byline mt-4">Carrier sats · pool-ready</p>
    </aside>
  );
}
