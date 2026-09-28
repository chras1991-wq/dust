import { DocBack, DocShell } from "@/components/DocShell";

export default function WhatIsSatdust() {
  return (
    <DocShell title="What is SATDUST" section="§ D.1">
      <p>
        SATDUST is an experimental DUST-20 digital asset on Bitcoin Mainnet. Brand line:
        Bitcoin Dust. Carried by Sats.
      </p>
      <p>
        Phase 1 does three things only: deploy SATDUST, mint from the site, and verify each
        mint in the explorer. Marketplace, swap, staking, farming, bridge, DAO, and complex
        NFT surfaces are deferred.
      </p>
      <ul>
        <li>Total supply: 10,000</li>
        <li>1 SATDUST per mint; lim_sats = 546</li>
        <li>546 sats backing per unit</li>
        <li>$7 USD-equivalent BTC mint fee</li>
        <li>No premine. No team allocation. First come, first served.</li>
      </ul>
      <p>
        SATDUST is fungible. UI may show Mint Sequence numbers; it must not imply Token IDs.
      </p>
      <DocBack />
    </DocShell>
  );
}
