import Link from "next/link";
import { EditorialAside, ParamTable, ProtocolDiagram } from "@/components/Figures";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div>
      <section className="hero-media">
        <div className="page-shell relative z-[1] flex min-h-[62vh] flex-col justify-end pb-10 pt-12 sm:min-h-[70vh] sm:pb-14 sm:pt-20">
          <p className="animate-rise kicker text-[var(--accent-soft)]">DUST-20 · Bitcoin Mainnet</p>
          <h1 className="animate-rise-delay masthead mt-3 max-w-4xl text-[clamp(3.25rem,15vw,7.5rem)] text-[var(--paper)]">
            SATDUST
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-2xl font-display text-xl italic leading-snug text-[var(--paper)] sm:mt-5 sm:text-2xl md:text-3xl">
            Assets that carry their own liquidity.
          </p>
          <p className="animate-rise-delay-2 mt-3 max-w-xl font-sans text-base leading-relaxed text-[var(--accent-soft)] sm:text-lg">
            DUST-20 is a Bitcoin mainnet protocol that builds each unit into a real satoshi UTXO —
            spendable BTC glued to the asset. SATDUST is the first ticker.
          </p>
          <div className="animate-rise-delay-2 btn-row mt-7 sm:mt-8">
            <Link href="/mint" className="btn btn-solid">
              Mint SATDUST
            </Link>
            <Link href="/docs/dust20" className="btn btn-ghost-on-dark">
              How DUST-20 works
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
            <p className="byline">Plain English · 01</p>
            <h2 className="font-display mt-2 text-[1.85rem] leading-tight sm:text-4xl md:text-5xl">
              Most Bitcoin tokens are ledger entries. DUST-20 builds a liquidity UTXO.
            </h2>
            <p className="dropcap deck mt-6">
              A lot of protocols write a number into an inscription and let an indexer remember who
              owns it. That balance is not Bitcoin you can spend. DUST-20 does the opposite: when you
              mint, the protocol constructs a carrier UTXO — real sats on L1 — and binds the asset to
              that output.
            </p>
            <p className="mt-5 text-[var(--ink-soft)]">
              Hold SATDUST and you also hold its carrier sats. Transfer means spending that UTXO like
              any other Bitcoin output. No bridge. No sidechain. No separate “transfer” opcode.
            </p>
          </article>
          <EditorialAside />
        </div>

        <hr className="mag-rule-accent" />

        <section className="relative">
          <div className="absolute -left-2 top-0 page-mark hidden md:block">pp. 04–07</div>
          <p className="kicker">How it works</p>
          <h2 className="font-display mt-2 max-w-3xl text-[1.85rem] italic sm:text-4xl md:text-5xl">
            One mint. One UTXO. Asset + liquidity together.
          </h2>
          <div className="mt-6 grid gap-6 sm:mt-8 md:grid-cols-12">
            <div className="scroll-x md:col-span-7">
              <ProtocolDiagram />
            </div>
            <ol className="space-y-4 font-sans text-[0.95rem] text-[var(--ink-soft)] md:col-span-5 md:pt-2">
              <li>
                <strong className="text-[var(--ink)]">1. Inscribe mint JSON</strong> — tick, amount,
                and how many sats the carrier must hold.
              </li>
              <li>
                <strong className="text-[var(--ink)]">2. Reveal builds the carrier</strong> — for
                SATDUST that is exactly {UNIT_SATS} sats, inscription at offset 0.
              </li>
              <li>
                <strong className="text-[var(--ink)]">3. Indexer accepts or rejects</strong> — wrong
                sats or wrong offset can confirm on Bitcoin and still fail as DUST.
              </li>
            </ol>
          </div>
          <p className="pull-quote mt-8 text-[1.25rem] sm:text-[1.45rem]">
            If the carrier is wrong, you do not get the asset. Liquidity is not a marketing claim —
            it is the UTXO itself.
          </p>
        </section>

        <hr className="mag-rule" />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Hard rules</p>
              <h2 className="font-display mt-2 text-[1.85rem] sm:text-4xl">
                Three checks. Fail any one, mint dies.
              </h2>
            </div>
            <p className="folio text-xl">Fig. A</p>
          </div>
          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-3">
            <div className="panel-edit md:mt-8">
              <span className="overlap-label">01</span>
              <h3 className="font-display mt-4 text-2xl">Exact carrier</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                The output must hold exactly the sats declared in the mint. Off by one sat? Bitcoin
                may confirm the tx. DUST still rejects it.
              </p>
            </div>
            <div className="panel-edit slant-block">
              <span className="overlap-label">02</span>
              <h3 className="font-display mt-4 text-2xl">Offset zero</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                The inscription sits on the first sat of that carrier. Anywhere else and the mint is
                invalid.
              </p>
            </div>
            <div className="panel-edit md:mt-12">
              <span className="overlap-label">03</span>
              <h3 className="font-display mt-4 text-2xl">One ticker identity</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                SATDUST, satdust, SatDust are the same name. First valid deploy wins; later copies do
                not.
              </p>
            </div>
          </div>
        </section>

        <hr className="mag-rule" />

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.3fr] lg:gap-10">
          <div>
            <p className="kicker">Deploy</p>
            <h2 className="font-display mt-2 text-[1.85rem] leading-tight sm:text-4xl">
              The token rules, written once on-chain
            </h2>
            <p className="mt-4 text-[var(--ink-soft)]">
              Deploy fixes supply and how many sats back each unit. For SATDUST: {SUPPLY} units ×{" "}
              {UNIT_SATS} sats = {MAX_SATS.toLocaleString()} sats of carrier capacity.
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
          <p className="kicker">Transfers</p>
          <h2 className="font-display mt-2 text-[1.85rem] sm:text-4xl md:text-5xl">
            Move the UTXO. The asset follows.
          </h2>
          <div className="mt-6 max-w-3xl space-y-5 text-[var(--ink-soft)]">
            <p>
              There is no <code className="font-mono text-sm">op:transfer</code>. Ownership moves when
              you spend the carrier like a normal Bitcoin output. Sat ranges go in; sat ranges come
              out; DUST units ride along.
            </p>
            <p>
              That is the point of a liquidity UTXO: the asset never floats free of spendable sats.
              Price and quantity for minting live only on the mint page — this page stays on the
              protocol.
            </p>
          </div>
        </section>

        <hr className="mag-rule" />

        <section className="panel-edit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="kicker">Check a mint</p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl md:text-4xl">
                Valid means all of this is true
              </h2>
            </div>
            <span className="pill-tag">Prove</span>
          </div>
          <ol className="mt-6 list-decimal space-y-2 pl-5 font-sans text-[0.95rem] text-[var(--ink-soft)]">
            <li>Mainnet transaction exists and confirms</li>
            <li>Inscription is dust-20 / mint / SATDUST</li>
            <li>Amount × unit sats equals declared sats</li>
            <li>Carrier output value matches those sats</li>
            <li>Inscription offset is 0</li>
            <li>Deploy exists and supply is not exceeded</li>
            <li>A compatible indexer accepts the mint</li>
          </ol>
          <div className="btn-row mt-8">
            <Link href="/verify" className="btn btn-solid">
              Run verifier
            </Link>
            <Link href="/docs" className="btn btn-ghost">
              Full notes
            </Link>
          </div>
        </section>

        <div className="footnote">
          DUST-20 v1.1.0 · Bitcoin mainnet · Experimental. Bitcoin Core does not natively understand
          SATDUST; balances depend on compatible indexers.
        </div>
      </div>
    </div>
  );
}
