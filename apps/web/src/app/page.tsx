import Link from "next/link";
import { CollageStampCloud, DustField, ParamTable, ProtocolDiagram } from "@/components/Figures";
import { PROJECT_ADDRESS, MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Full-bleed maximalist hero */}
      <section className="relative min-h-[88vh] overflow-hidden border-b-4 border-[var(--c-black)]">
        <DustField />
        <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_40%,rgba(255,106,0,0.25),rgba(255,45,149,0.3),rgba(46,242,255,0.2),rgba(184,255,60,0.2),rgba(255,106,0,0.25))] mix-blend-screen opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg-ink)] to-transparent" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-16">
          <div className="absolute right-4 top-8 hidden sm:block">
            <div
              className="animate-spin-slow font-stamp text-[5rem] leading-none text-[var(--c-yellow)] opacity-30"
              aria-hidden
            >
              ★
            </div>
          </div>

          <span
            className="sticker sticker-lime w-fit animate-wobble"
            style={{ ["--rot" as string]: "-4deg" }}
          >
            BITCOIN DUST PROTOCOL
          </span>

          <h1 className="hero-title animate-pop mt-5 text-[18vw] sm:text-[9.5rem]">
            SATDUST
          </h1>

          <p className="mt-4 max-w-xl font-stamp text-2xl uppercase leading-tight text-[var(--c-cream)] sm:text-3xl">
            Bitcoin Dust.
            <span className="text-[var(--c-cyan)]"> Carried by Sats.</span>
          </p>

          <p className="mt-4 max-w-lg text-lg text-[var(--ink-dim)]">
            10,000 units. Born on Bitcoin. No bridge. No sidechain. Just Bitcoin.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
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

      <div className="section-band">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <CollageStampCloud />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16">
        <section className="panel-chaos">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="sticker sticker-cyan" style={{ ["--rot" as string]: "2deg" }}>
                PIPELINE
              </span>
              <h2 className="font-display mt-4 text-4xl font-extrabold uppercase leading-none text-[var(--c-yellow)] sm:text-5xl">
                Mainnet → DUST-20 → Mint → Verify
              </h2>
              <p className="mt-3 max-w-2xl text-[var(--ink-dim)]">
                Phase-1 only. Marketplace, swap, staking, farming, bridges, DAO — not this
                build.
              </p>
            </div>
            <span
              className="sticker sticker-hot animate-wobble"
              style={{ ["--rot" as string]: "8deg" }}
            >
              KEEP IT LOUD
            </span>
          </div>
          <div className="mt-6">
            <ProtocolDiagram />
          </div>
        </section>

        <hr className="rule" />

        <section className="panel-lime">
          <span className="sticker sticker-orange" style={{ ["--rot" as string]: "-3deg" }}>
            DEPLOY JSON
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold uppercase text-[var(--c-lime)]">
            Issuance payload
          </h2>
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
          <p className="mt-6 font-mono text-sm text-[var(--c-cyan)]">
            max_sats = {SUPPLY.toLocaleString()} × {UNIT_SATS} = {MAX_SATS.toLocaleString()} sats
            = 0.0546 BTC backing (not revenue).
          </p>
        </section>

        <hr className="rule" />

        <section>
          <span className="sticker sticker-yellow" style={{ ["--rot" as string]: "4deg" }}>
            MONEY SPLIT
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold uppercase">
            Three different piles of sats
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="panel-chaos">
              <p className="font-stamp text-[var(--c-lime)]">01 BACKING</p>
              <p className="mt-2 text-3xl font-extrabold text-[var(--c-yellow)]">
                {UNIT_SATS} sats
              </p>
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                Lands in your SATDUST carrier UTXO. Not project income.
              </p>
            </div>
            <div className="panel-chaos" style={{ boxShadow: "8px 8px 0 var(--c-orange)" }}>
              <p className="font-stamp text-[var(--c-magenta)]">02 MINT FEE</p>
              <p className="mt-2 text-3xl font-extrabold text-[var(--c-magenta)]">$7 ≡ BTC</p>
              <p className="mt-2 break-all font-mono text-[0.7rem] text-[var(--c-cyan)]">
                {PROJECT_ADDRESS}
              </p>
            </div>
            <div className="panel-chaos" style={{ boxShadow: "8px 8px 0 var(--c-lime)" }}>
              <p className="font-stamp text-[var(--c-cyan)]">03 MINER FEE</p>
              <p className="mt-2 text-3xl font-extrabold text-[var(--c-cyan)]">NETWORK</p>
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
