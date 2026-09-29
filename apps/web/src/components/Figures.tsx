export function ProtocolDiagram() {
  return (
    <pre className="formula">{`Bitcoin L1 (consensus)
   │  confirmed tx graph
   ▼
Inscription envelope  (commit → reveal)
   │  content-type: application/json
   ▼
DUST-20 predicate machine
   ├── deploy  → ticker registry (case-fold, first-wins)
   └── mint    → carrier.value == declared.sats
                 && inscription.offset == 0
                 && minted + amt ≤ supply
   ▼
Satoshi topology transfer
   │  no transfer opcode — allocation follows
   │  input sat ranges → output sat ranges
   ▼
Compatible indexer  =  authoritative balances`}</pre>
  );
}

export function ParamTable() {
  const rows = [
    ["p", "dust-20", "Protocol identifier"],
    ["tick", "SATDUST", "Case-folded ticker identity"],
    ["supply", "10000", "Hard cap on mint acceptance"],
    ["unit_sats", "546", "Sats bound per unit"],
    ["max_sats", "5460000", "Invariant: supply × unit_sats"],
    ["lim_sats", "546", "Per-tx mint sats ceiling"],
  ];

  return (
    <table className="table-spec">
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Semantics</th>
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
      <p className="kicker">Field notes</p>
      <p className="font-display mt-3 text-2xl italic leading-snug">
        “The chain confirms ink. The indexer decides meaning.”
      </p>
      <p className="byline mt-4">On meta-protocols</p>
    </aside>
  );
}
