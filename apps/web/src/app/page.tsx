import Link from "next/link";
import { EditorialAside, ParamTable, ProtocolDiagram } from "@/components/Figures";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div>
      {/* Full-bleed editorial opener */}
      <section className="hero-media">
        <div className="relative z-[1] mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-20">
          <p className="animate-rise kicker text-[var(--accent-soft)]">Cover story · Protocol</p>
          <h1 className="animate-rise-delay masthead mt-3 max-w-4xl text-[18vw] text-[var(--paper)] md:text-[7.5rem]">
            SATDUST
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-xl font-display text-2xl italic leading-snug text-[var(--paper)] md:text-3xl">
            Sat-bound assets on Bitcoin L1.
            <span className="not-italic text-[var(--accent-soft)]"> Indexed, not consensus.</span>
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/docs/dust20" className="btn btn-solid">
              Read the Spec
            </Link>
            <Link
              href="/verify"
              className="btn btn-ghost border-[var(--paper)] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            >
              Verification
            </Link>
            <Link
              href="/mint"
              className="btn btn-ghost border-[var(--paper)] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            >
              Open Mint
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14">
        {/* Irregular two-column opener */}
        <div className="grid items-start gap-10 lg:grid-cols-[1.35fr_0.9fr]">
          <article>
            <p className="byline">Essay · 01</p>
            <h2 className="font-display mt-2 text-4xl leading-tight md:text-5xl">
              A meta-protocol that rides satoshis, not a virtual machine
            </h2>
            <p className="dropcap deck mt-6">
              SATDUST binds fungible units to exact satoshi carriers through inscription predicates
              and UTXO topology. There is no bridge, no sidechain, and no account model pretending
              to be Bitcoin. Confirmed ink on L1 is necessary; compatible indexers make it legible.
            </p>
            <p className="mt-5 text-[var(--ink-soft)]">
              DUST-20 does not extend Bitcoin consensus. It is a deterministic reading of JSON
              inscriptions plus satoshi-range accounting over ordinary spends. Invalid layouts can
              still confirm on-chain — and simply never mint.
            </p>
          </article>
          <EditorialAside />
        </div>

        <hr className="mag-rule-accent" />

        {/* Broken grid feature band */}
        <section className="relative">
          <div className="absolute -left-2 top-0 page-mark hidden md:block">pp. 04–07</div>
          <p className="kicker">Architecture</p>
          <h2 className="font-display mt-2 max-w-3xl text-4xl italic md:text-5xl">
            From confirmation to meaning
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <ProtocolDiagram />
            </div>
            <div className="flex flex-col justify-between gap-6 md:col-span-5 md:pt-8">
              <p className="pull-quote m-0 text-[1.45rem]">
                Carrier value must equal declared sats. Offset must be zero. Everything else is
                commentary.
              </p>
              <p className="font-sans text-sm text-[var(--ink-mute)]">
                Pre-broadcast asserts abort when either invariant fails. Databases remain caches;
                RBF and reorgs force re-evaluation.
              </p>
            </div>
          </div>
        </section>

        <hr className="mag-rule" />

        {/* Three irregular editorial cards - not identical cards, staggered */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Invariants</p>
              <h2 className="font-display mt-2 text-4xl">Three hard rules</h2>
            </div>
            <p className="folio text-xl">Fig. A</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="panel-edit md:mt-8">
              <span className="overlap-label">01</span>
              <h3 className="font-display mt-4 text-2xl">Exact carrier</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                <code className="font-mono text-sm">vout.value</code> must equal declared{" "}
                <code className="font-mono text-sm">sats</code>. ±1 sat confirms on L1 and still
                fails acceptance.
              </p>
            </div>
            <div className="panel-edit slant-block">
              <span className="overlap-label">02</span>
              <h3 className="font-display mt-4 text-2xl">Offset zero</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                The mint inscription occupies satoshi offset{" "}
                <code className="font-mono text-sm">0</code> of the carrier. No exceptions.
              </p>
            </div>
            <div className="panel-edit md:mt-12">
              <span className="overlap-label">03</span>
              <h3 className="font-display mt-4 text-2xl">Case-folded tick</h3>
              <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
                SATDUST / satdust / SatDust collapse to one identity. First valid deploy wins.
              </p>
            </div>
          </div>
        </section>

        <hr className="mag-rule" />

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.3fr]">
          <div>
            <p className="kicker">Deploy schema</p>
            <h2 className="font-display mt-2 text-4xl leading-tight">
              The issuance object, locked in ink
            </h2>
            <p className="mt-4 text-[var(--ink-soft)]">
              <code className="font-mono text-sm">max_sats</code> is constrained by{" "}
              <code className="font-mono text-sm">supply × unit_sats</code> — not free prose.
            </p>
            <p className="mt-6 font-mono text-sm text-[var(--accent)]">
              assert → {SUPPLY} × {UNIT_SATS} = {MAX_SATS}
            </p>
          </div>
          <div>
            <pre className="formula">{`{
  "p": "dust-20",
  "op": "deploy",
  "tick": "SATDUST",
  "supply": "10000",
  "unit_sats": "546",
  "max_sats": "5460000",
  "lim_sats": "546"
}`}</pre>
            <div className="mt-6 overflow-x-auto">
              <ParamTable />
            </div>
          </div>
        </section>

        <hr className="mag-rule-accent" />

        <section>
          <p className="kicker">Execution</p>
          <h2 className="font-display mt-2 text-4xl md:text-5xl">
            Transfer without a transfer opcode
          </h2>
          <div className="mt-8 columns-1 gap-10 md:columns-2">
            <p className="mb-5 text-[var(--ink-soft)]">
              Asset movement is derived from ordinary Bitcoin spends. Input sat ranges are ordered
              into outputs; DUST units ride those ranges. There is no{" "}
              <code className="font-mono text-sm">op:transfer</code>.
            </p>
            <p className="mb-5 text-[var(--ink-soft)]">
              Wallet UTXO selection and change layout decide whether balances survive a spend.
              Colored inputs — Ordinals, Runes, BRC-20, DUST — must never be selected as funding
              inputs for mint construction.
            </p>
            <p className="mb-5 text-[var(--ink-soft)]">
              Inscriptions use a commit/reveal envelope. Reveal constructs the carrier and embeds
              mint JSON. Acceptance is L1 confirmation plus indexer approval — nothing else.
            </p>
            <p className="text-[var(--ink-soft)]">
              Operational quantity and pricing appear only on the mint surface. This essay stays
              with the machine.
            </p>
          </div>
        </section>

        <hr className="mag-rule" />

        <section className="panel-edit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="kicker">Verification</p>
              <h2 className="font-display mt-2 text-3xl md:text-4xl">Acceptance checklist</h2>
            </div>
            <span className="pill-tag">Prove</span>
          </div>
          <ol className="mt-6 list-decimal space-y-2 pl-5 font-sans text-[0.95rem] text-[var(--ink-soft)]">
            <li>mainnet tx exists ∧ confirms</li>
            <li>inscription: p=dust-20 ∧ op=mint ∧ tick≡SATDUST</li>
            <li>amt × unit_sats == sats</li>
            <li>carrier.vout.value == sats</li>
            <li>inscription.offset == 0</li>
            <li>deploy exists ∧ supply not exceeded</li>
            <li>indexer.accept(mint) == true</li>
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/verify" className="btn btn-solid">
              Run verifier
            </Link>
            <Link href="/docs" className="btn btn-ghost">
              Archive
            </Link>
          </div>
        </section>

        <div className="footnote">
          Spec reference: DUST-20 v1.1.0 (2026-09-01), Bitcoin mainnet, Experimental. Confirm ticker
          vacancy against an authoritative index before deploy.
        </div>
      </div>
    </div>
  );
}
