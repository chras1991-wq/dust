import { DocBack, DocShell } from "@/components/DocShell";
import { UNIT_SATS } from "@satdust/shared";
import Link from "next/link";

export default function WhatIsSatdust() {
  return (
    <DocShell title="What is SATDUST" section="Archive · 01">
      <p>
        <strong>SATDUST</strong> is the first fungible asset under DUST-20 on Bitcoin mainnet. Mint
        one unit and you receive that unit bound to a {UNIT_SATS}-sat carrier UTXO — the asset and
        its liquidity in one output.
      </p>
      <p>Phase 1 covers three things:</p>
      <ul>
        <li>Deploy the SATDUST ticker under DUST-20</li>
        <li>Mint with an exact carrier and offset-0 inscription</li>
        <li>Verify against chain confirmation plus indexer rules</li>
      </ul>
      <p>
        Not in scope: marketplace, swaps, staking, bridges, DAO tools. Mint price and quantity sit
        only on <Link href="/mint">/mint</Link>.
      </p>
      <p>
        Units are fungible. Explorer “mint sequence” is just ordering — not a unique token id.
      </p>
      <DocBack />
    </DocShell>
  );
}
