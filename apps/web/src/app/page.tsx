import Link from "next/link";
import { EditorialAside, ParamTable, ProtocolDiagram } from "@/components/Figures";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div>
      <section className="hero-media">
        <div className="page-shell relative z-[1] flex min-h-[62vh] flex-col justify-end pb-10 pt-12 sm:min-h-[70vh] sm:pb-14 sm:pt-20">
          <p className="animate-rise kicker text-[var(--accent-soft)]">Bitcoin Mainnet</p>
          <h1 className="animate-rise-delay masthead mt-3 max-w-4xl text-[clamp(3.25rem,15vw,7.5rem)] text-[var(--paper)]">
            SATDUST
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-2xl font-display text-xl italic leading-snug text-[var(--paper)] sm:mt-5 sm:text-2xl md:text-3xl">
            DUST-20 — the first Bitcoin-native protocol that constructs liquidity UTXOs.
          </p>
          <p className="animate-rise-delay-2 mt-3 max-w-lg font-sans text-base leading-relaxed text-[var(--accent-soft)] sm:text-lg">
            SATDUST is the opening ticker. Each unit is bound to a {UNIT_SATS}-sat carrier you can
            spend on L1.
          </p>
          <div className="animate-rise-delay-2 btn-row mt-7 sm:mt-8">
            <Link href="/mint" className="btn btn-solid">
              Mint SATDUST
            </Link>
            <Link href="/docs/dust20" className="btn btn-ghost-on-dark">
              Read DUST-20
            </Link>
            <Link href="/verify" className="btn btn-ghost-on-dark">
              Verify a mint
            </Link>
          </div>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
          <article>
            <p className="byline">Essay · 01</p>
            <h2 className="font-display mt-2 text-[1.85rem] leading-tight sm:text-4xl md:text-5xl">
              Other protocols track balances. This one builds the UTXO.
            </h2>
            <p className="dropcap deck mt-6">
              Most Bitcoin token schemes write a number into an inscription and leave an indexer to
              remember who owns it. That number is not sats you can spend. Under DUST-20, a mint
              creates a carrier output — real sats on mainnet — and attaches the asset to that
              output.
            </p>
            <p className="mt-5 text-[var(--ink-soft)]">
              Transfer is a normal Bitcoin spend of that carrier. No bridge, no sidechain, no
              transfer opcode.
            </p>
          </article>
          <EditorialAside />
        </div>

        <hr className="mag-rule-accent" />

        <section className="relative">
          <div className="absolute -left-2 top-0 page-mark hidden md:block">pp. 04–07</div>
          <p className="kicker">Mint path</p>
          <h2 className="font-display mt-2 max-w-3xl text-[1.85rem] italic sm:text-4xl md:text-5xl">
            Inscribe. Build the carrier. Indexer accepts or you get nothing.
          </h2>
          <div className="mt-6 grid gap-6 sm:mt-8 md:grid-cols-12">
            <div className="scroll-x md:col-span-7">
              <ProtocolDiagram />
            </div>
            <ol className="space-y-4 font-sans text-[0.95rem] text-[var(--ink-soft)] md:col-span-5 md:pt-2">
              <li>
                <strong className="text-[var(--ink)]">1. Mint JSON</strong> — ticker, amount, and
                required carrier sats.
              </li>
              <li>
                <strong className="text-[var(--ink)]">2. Reveal</strong> — creates the{" "}
                {UNIT_SATS}-sat carrier with the inscription at offset 0.
              </li>
              <li>
                <strong className="text-[var(--ink)]">3. Acceptance</strong> — wrong sats or offset
                can confirm on Bitcoin and still fail as DUST.
              </li>
            </ol>
          </div>
        </section>

        <hr className="mag-rule" />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Rules</p>
              <h2 className="font-display mt-2 text-[1.85rem] sm:text-4xl">
                Fail one check and the mint is dead
              </h2>
            </div>
            <p className="folio text-xl">Fig. A</p>
          </div>
          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-3">
            <div className="panel-edit md:mt-8">
              <span className="overlap-label">01</span>
              <h3 className="font-display mt-4 text-2xl">Exact carrier</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                Output value must match the sats in the mint payload. Off-by-one can confirm on
                Bitcoin and still get rejected.
              </p>
            </div>
            <div className="panel-edit slant-block">
              <span className="overlap-label">02</span>
              <h3 className="font-display mt-4 text-2xl">Offset zero</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                Inscription sits on the first sat of the carrier. Anywhere else is invalid.
              </p>
            </div>
            <div className="panel-edit md:mt-12">
              <span className="overlap-label">03</span>
              <h3 className="font-display mt-4 text-2xl">One ticker</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                Case does not matter. First valid deploy for the name wins.
              </p>
            </div>
          </div>
        </section>

        <hr className="mag-rule" />

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.3fr] lg:gap-10">
          <div>
            <p className="kicker">Deploy</p>
            <h2 className="font-display mt-2 text-[1.85rem] leading-tight sm:text-4xl">
              Supply and carrier size, locked once
            </h2>
            <p className="mt-4 text-[var(--ink-soft)]">
              SATDUST: {SUPPLY.toLocaleString()} units × {UNIT_SATS} sats ={" "}
              {MAX_SATS.toLocaleString()} sats of total carrier capacity.
            </p>
          </div>
          <div className="min-w-0">
            <pre className="formula">{`{
  "p": "dust-20",
  "op": "deploy",
  "tick": "SATDUST",
  "supply": "10000",
  "unit_sats": "546",
  "max_sats": "5460000",
  "lim_sats": "546"
}`}</pre>
            <div className="scroll-x mt-6">
              <ParamTable />
            </div>
          </div>
        </section>

        <hr className="mag-rule-accent" />

        <section>
          <p className="kicker">Transfer</p>
          <h2 className="font-display mt-2 text-[1.85rem] sm:text-4xl md:text-5xl">
            Spend the carrier. The asset moves with it.
          </h2>
          <p className="mt-6 max-w-2xl text-[var(--ink-soft)]">
            No <code className="font-mono text-sm">op:transfer</code>. Sat ranges flow through a
            normal spend; DUST units follow those ranges. Mint price is only on{" "}
            <Link href="/mint">/mint</Link>.
          </p>
        </section>

        <hr className="mag-rule" />

        <section className="panel-edit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="kicker">Verify</p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl md:text-4xl">
                A mint counts only if all of this holds
              </h2>
            </div>
            <span className="pill-tag">Prove</span>
          </div>
          <ol className="mt-6 list-decimal space-y-2 pl-5 font-sans text-[0.95rem] text-[var(--ink-soft)]">
            <li>Mainnet tx confirms</li>
            <li>Inscription is dust-20 / mint / SATDUST</li>
            <li>Amount × unit sats equals declared sats</li>
            <li>Carrier value matches those sats</li>
            <li>Inscription offset is 0</li>
            <li>Deploy exists; supply not exceeded</li>
            <li>Indexer accepts</li>
          </ol>
          <div className="btn-row mt-8">
            <Link href="/verify" className="btn btn-solid">
              Run verifier
            </Link>
            <Link href="/docs" className="btn btn-ghost">
              Notes
            </Link>
          </div>
        </section>

        <div className="footnote">
          DUST-20 v1.1.0 · Bitcoin mainnet · Experimental. Not Bitcoin consensus; indexer-dependent.
        </div>
      </div>
    </div>
  );
}
