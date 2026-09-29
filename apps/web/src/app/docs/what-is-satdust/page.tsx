import { DocBack, DocShell } from "@/components/DocShell";
import { UNIT_SATS } from "@satdust/shared";
import Link from "next/link";

export default function WhatIsSatdust() {
  return (
    <DocShell title="What is SATDUST" section="Archive · 01">
      <p>
        <strong>SATDUST</strong> is the first fungible ticker under DUST-20. A mint gives you one
        unit on a {UNIT_SATS}-sat UTXO on Bitcoin mainnet.
      </p>
      <p>Phase 1:</p>
      <ul>
        <li>Deploy the ticker</li>
        <li>Mint with exact sats and offset 0</li>
        <li>Verify against chain + indexer rules</li>
      </ul>
      <p>
        Not in scope yet: marketplace, swaps, staking, bridges. Price only on{" "}
        <Link href="/mint">/mint</Link>. Mint sequence in the explorer is order, not a token id.
      </p>
      <DocBack />
    </DocShell>
  );
}
