import Link from "next/link";
import { DustField, ParamTable, ProtocolDiagram } from "@/components/Figures";
import { PROJECT_ADDRESS, MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div className="relative">
      <DustField />
      <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="section-num animate-fade-up">§0 · Abstract</p>
        <h1 className="font-display animate-fade-up mt-3 text-6xl leading-none tracking-tight text-[var(--ink)] sm:text-8xl">
          SATDUST
        </h1>
        <p className="animate-fade-up-delay mt-6 max-w-xl font-display text-2xl leading-snug text-[var(--ink-dim)] sm:text-3xl">
          Bitcoin Dust.
          <br />
          Carried by Sats.
        </p>
        <p className="animate-fade-up-delay-2 mt-6 max-w-2xl text-[var(--ink-dim)]">
          10,000 units. Born on Bitcoin. No bridge. No sidechain. Just Bitcoin.
        </p>

        <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap gap-3">
          <Link href="/mint" className="btn btn-solid">
            Mint SATDUST
          </Link>
          <Link href="/docs/dust20" className="btn">
            Read DUST-20
          </Link>
          <Link href="/verify" className="btn btn-ghost">
            Verify
          </Link>
        </div>

        <div className="mt-16 grid gap-6 border-t border-[var(--rule)] pt-8 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-[var(--ink-dim)] sm:grid-cols-5">
          <div>
            <div className="text-[var(--accent)]">{SUPPLY.toLocaleString()}</div>
            <div className="mt-1">Supply</div>
          </div>
          <div>
            <div className="text-[var(--accent)]">1</div>
            <div className="mt-1">Per mint</div>
          </div>
          <div>
            <div className="text-[var(--accent)]">{UNIT_SATS}</div>
            <div className="mt-1">Sats / unit</div>
          </div>
          <div>
            <div className="text-[var(--accent)]">$7</div>
            <div className="mt-1">Mint fee</div>
          </div>
          <div>
            <div className="text-[var(--accent)]">Mainnet</div>
            <div className="mt-1">Bitcoin</div>
          </div>
        </div>

        <hr className="rule" />

        <section>
          <p className="section-num">§1 · Protocol chain</p>
          <h2 className="font-display mt-2 text-3xl">Mainnet → DUST-20 → Mint → Verify</h2>
          <p className="mt-3 max-w-2xl text-[var(--ink-dim)]">
            Phase-1 scope is deliberately narrow. Marketplace, swap, staking, farming,
            bridges, and DAO mechanisms are out of scope.
          </p>
          <div className="mt-6">
            <ProtocolDiagram />
          </div>
        </section>

        <hr className="rule" />

        <section>
          <p className="section-num">§2 · Issuance parameters</p>
          <h2 className="font-display mt-2 text-3xl">Deploy payload</h2>
          <pre className="formula mt-6">{`{
  "p": "dust-20",
  "op": "deploy",
  "tick": "SATDUST",
  "supply": "10000",
  "unit_sats": "546",
  "max_sats": "5460000",
  "lim_sats": "546"
}`}</pre>
          <div className="mt-8 overflow-x-auto">
            <ParamTable />
          </div>
          <p className="mt-6 font-mono text-sm text-[var(--ink-dim)]">
            max_sats = supply × unit_sats = {SUPPLY.toLocaleString()} × {UNIT_SATS} ={" "}
            {MAX_SATS.toLocaleString()} sats = 0.0546 BTC (backing, not revenue).
          </p>
        </section>

        <hr className="rule" />

        <section>
          <p className="section-num">§3 · Economic decomposition</p>
          <h2 className="font-display mt-2 text-3xl">Three distinct payments per mint</h2>
          <ol className="mt-6 list-decimal space-y-4 pl-5 text-[var(--ink-dim)]">
            <li>
              <span className="text-[var(--ink)]">SATDUST backing</span> — {UNIT_SATS} sats in
              the user carrier UTXO. Not project income.
            </li>
            <li>
              <span className="text-[var(--ink)]">Project mint fee</span> — $7 USD equivalent
              BTC to{" "}
              <code className="font-mono text-[0.8rem] text-[var(--accent)]">
                {PROJECT_ADDRESS}
              </code>
              .
            </li>
            <li>
              <span className="text-[var(--ink)]">Miner fee</span> — Bitcoin network fee, paid
              by the user.
            </li>
          </ol>
        </section>

        <div className="footnote">
          Ticker identity is case-folded: SATDUST / satdust / SatDust are the same. The first
          valid deployment wins. Confirm ticker vacancy against an authoritative DUST-20 index
          before mainnet deploy.
        </div>
      </div>
    </div>
  );
}
