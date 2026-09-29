import { DocBack, DocShell } from "@/components/DocShell";

export default function WhatIsSatdust() {
  return (
    <DocShell title="What is SATDUST" section="§ 01">
      <p>
        SATDUST is a fungible DUST-20 asset inscribed on Bitcoin Mainnet. Units are bound to
        satoshi carriers through inscription predicates and sat-range accounting — not through an
        account model or virtual machine.
      </p>
      <p>Phase-1 surface area:</p>
      <ul>
        <li>Deploy the SATDUST ticker under DUST-20 rules</li>
        <li>Mint via commit/reveal with exact carrier invariants</li>
        <li>Verify acceptance against L1 + indexer predicates</li>
      </ul>
      <p>
        Out of scope: marketplace mutation, swap, staking, bridges, DAO tooling. Mint pricing and
        per-mint quantity are documented exclusively on the mint UI.
      </p>
      <p>
        SATDUST is fungible. Explorer may show Mint Sequence as ordering metadata — never as Token
        ID.
      </p>
      <DocBack />
    </DocShell>
  );
}
