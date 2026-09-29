export function ProtocolDiagram() {
  return (
    <pre className="formula">{`Bitcoin mainnet
   │  a normal confirmed transaction
   ▼
Inscription (commit → reveal)
   │  JSON: dust-20 mint
   ▼
Build liquidity UTXO
   │  carrier sats == declared sats
   │  inscription at offset 0
   ▼
Indexer accepts → you hold
   SATDUST + spendable carrier sats
   ▼
Transfer = spend that UTXO
   (no separate transfer opcode)`}</pre>
  );
}

export function ParamTable() {
  const rows = [
    ["p", "dust-20", "Protocol name"],
    ["tick", "SATDUST", "Ticker (case ignored)"],
    ["supply", "10000", "Max units that can mint"],
    ["unit_sats", "546", "Sats glued to each unit"],
    ["max_sats", "5460000", "supply × unit_sats"],
    ["lim_sats", "546", "Max sats per mint tx"],
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
      <p className="kicker">The idea</p>
      <p className="font-display mt-3 text-2xl italic leading-snug">
        “Every mint builds a liquidity UTXO — the asset and the sats leave together.”
      </p>
      <p className="byline mt-4">DUST-20 in one line</p>
    </aside>
  );
}
