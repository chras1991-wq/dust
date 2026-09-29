import Link from "next/link";
import { CollageStampCloud, DustField, ParamTable, ProtocolDiagram } from "@/components/Figures";
import { PROJECT_ADDRESS, MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div className="relative">
      <section className="relative min-h-[88vh] overflow-hidden">
        <DustField />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,78,203,0.2),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-16">
          <span className="pill pill-cyan w-fit animate-floaty">bitcoin dust protocol</span>

          <h1 className="hero-title hologram-text mt-5 text-[16vw] sm:text-[8.5rem]">
            SATDUST
          </h1>

          <p className="mt-4 max-w-xl font-display text-xl font-bold uppercase tracking-wide text-[var(--silver)] sm:text-2xl">
            Bitcoin Dust.
            <span className="text-[var(--cyan)]"> Carried by Sats.</span>
          </p>

          <p className="mt-4 max-w-lg text-[var(--ink-dim)]">
            10,000 units. Born on Bitcoin. No bridge. No sidechain. Just Bitcoin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </section>

      <div className="border-y border-white/20 bg-gradient-to-r from-[rgba(255,78,203,0.15)] via-[rgba(65,243,255,0.12)] to-[rgba(198,255,77,0.15)]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <CollageStampCloud />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <section className="panel-y2k">
          <span className="pill pill-pink">pipeline</span>
          <h2 className="chrome-text mt-4 text-3xl sm:text-4xl">
            Mainnet → DUST-20 → Mint → Verify
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--ink-dim)]">
            Phase-1 only. Marketplace, swap, staking, farming, bridges, DAO — not this build.
          </p>
          <div className="mt-6">
            <ProtocolDiagram />
          </div>
        </section>

        <hr className="rule" />

        <section className="panel-chrome">
          <span className="pill pill-lime">deploy json</span>
          <h2 className="hologram-text mt-4 text-3xl sm:text-4xl">Issuance payload</h2>
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
          <p className="mt-6 font-mono text-xl text-[var(--cyan)]">
            max_sats = {SUPPLY.toLocaleString()} × {UNIT_SATS} = {MAX_SATS.toLocaleString()} sats
            = 0.0546 BTC backing (not revenue).
          </p>
        </section>

        <hr className="rule" />

        <section>
          <span className="pill pill-chrome">money split</span>
          <h2 className="chrome-text mt-4 text-3xl sm:text-4xl">Three piles of sats</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--lime)]">01 backing</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[var(--cyan)]">
                {UNIT_SATS} sats
              </p>
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                Lands in your SATDUST carrier UTXO. Not project income.
              </p>
            </div>
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--pink)]">02 mint fee</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[var(--pink)]">$7 ≡ BTC</p>
              <p className="mt-2 break-all font-mono text-base text-[var(--cyan)]">
                {PROJECT_ADDRESS}
              </p>
            </div>
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--cyan)]">03 miner fee</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[var(--lime)]">NETWORK</p>
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                Bitcoin miner fee. You pay it. Separate from $7.
              </p>
            </div>
          </div>
        </section>

        <div className="footnote">
          Ticker is case-folded: SATDUST / satdust / SatDust = same. First valid deploy wins.
          Re-check authoritative DUST-20 index before mainnet deploy.
        </div>
      </div>
    </div>
  );
}
