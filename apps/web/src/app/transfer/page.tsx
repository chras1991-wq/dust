import Link from "next/link";
import { TransferDesk } from "@/components/TransferDesk";

export const metadata = {
  title: "Transfer SATDUST — Bitcoin mainnet",
  description:
    "Connect a Bitcoin wallet and send SATDUST by spending DUST-20 carrier inscriptions on mainnet.",
};

export default function TransferPage() {
  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Bitcoin mainnet · DUST-20</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl">Transfer</h1>
      <p className="deck mt-3 max-w-2xl text-[0.95rem] sm:mt-4 sm:text-[1.05rem]">
        Import or connect any supported BTC wallet, bind your address, and transfer SATDUST to
        another bc1 recipient. Transfers are normal Bitcoin spends of the 546-sat carrier UTXO.
      </p>

      <div className="mt-8">
        <TransferDesk />
      </div>

      <section className="mt-10 text-sm text-[var(--ink-mute)]">
        <p className="byline">Notes</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Use an inscription-capable wallet (UniSat, Xverse, OKX, Magic Eden, etc.).</li>
          <li>
            Indexed balance comes from this site&apos;s mint ledger; on-chain holdings may differ
            until indexers sync.
          </li>
          <li>
            After transfer, the recipient can verify balances on{" "}
            <Link href="/explorer" className="text-[var(--accent)]">
              Index
            </Link>{" "}
            or{" "}
            <Link href="/verify" className="text-[var(--accent)]">
              Prove
            </Link>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
