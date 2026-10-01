import { TransferDesk } from "@/components/TransferDesk";

export default function HomePage() {
  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="deck max-w-2xl text-[0.95rem] sm:text-[1.05rem]">
        Bind a Bitcoin mainnet wallet (browser extension or WalletConnect), enter a bc1 recipient and
        amount, then confirm the inscription spend in your wallet. SATDUST moves with the 546-sat
        carrier UTXO — no separate transfer opcode.
      </p>

      <div className="mt-8">
        <TransferDesk />
      </div>

      <section className="mt-10 text-sm text-[var(--ink-mute)]">
        <p className="byline">Security</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Never paste a seed phrase, private key, or WIF on this page.</li>
          <li>Use inscription-capable wallets: UniSat, Xverse, OKX, Magic Eden, and similar.</li>
          <li>Network fees are paid in BTC from your connected wallet.</li>
        </ul>
      </section>
    </div>
  );
}
