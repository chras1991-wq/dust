import Link from "next/link";
import { DustField, ParamTable, ProtocolDiagram, TechPillStrip } from "@/components/Figures";
import { MAX_SATS, SUPPLY, UNIT_SATS } from "@satdust/shared";

export default function HomePage() {
  return (
    <div className="relative">
      <section className="relative min-h-[88vh] overflow-hidden">
        <DustField />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,78,203,0.2),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-16">
          <span className="pill pill-cyan w-fit animate-floaty">dust-20 meta-protocol</span>

          <h1 className="hero-title hologram-text mt-5 text-[16vw] sm:text-[8.5rem]">
            SATDUST
          </h1>

          <p className="mt-4 max-w-2xl font-display text-xl font-bold uppercase tracking-wide text-[var(--silver)] sm:text-2xl">
            Sat-bound assets on Bitcoin L1.
            <span className="text-[var(--cyan)]"> Indexed, not consensus.</span>
          </p>

          <p className="mt-4 max-w-2xl text-[var(--ink-dim)]">
            SATDUST binds fungible units to exact satoshi carriers via inscription predicates and
            UTXO topology — no bridge, no sidechain, no virtual machine.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/docs/dust20" className="btn btn-solid">
              Protocol Spec
            </Link>
            <Link href="/verify" className="btn">
              Verification Engine
            </Link>
            <Link href="/mint" className="btn btn-ghost">
              Open Mint
            </Link>
          </div>
        </div>
      </section>

      <div className="border-y border-white/20 bg-gradient-to-r from-[rgba(255,78,203,0.15)] via-[rgba(65,243,255,0.12)] to-[rgba(198,255,77,0.15)]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <TechPillStrip />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <section className="panel-y2k">
          <span className="pill pill-pink">architecture</span>
          <h2 className="chrome-text mt-4 text-3xl sm:text-4xl">
            L1 confirmation → inscription → DUST-20 predicates → indexer state
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--ink-dim)]">
            DUST-20 is not a Bitcoin consensus rule. It is a deterministic meta-protocol: JSON
            inscription payloads plus satoshi-range accounting over ordinary spends. Compatible
            indexers materialize balances; invalid layouts simply never mint.
          </p>
          <div className="mt-6">
            <ProtocolDiagram />
          </div>
        </section>

        <hr className="rule" />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel-y2k">
            <p className="font-pixel text-[0.55rem] text-[var(--pink)]">invariant · carrier</p>
            <h3 className="chrome-text mt-3 text-xl">Exact output value</h3>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              Mint carrier <code className="font-mono text-[var(--cyan)]">vout.value</code> must
              equal declared <code className="font-mono text-[var(--cyan)]">sats</code>. ±1 sat
              confirms on L1 and still fails DUST-20 acceptance.
            </p>
          </div>
          <div className="panel-y2k">
            <p className="font-pixel text-[0.55rem] text-[var(--cyan)]">invariant · offset</p>
            <h3 className="chrome-text mt-3 text-xl">Inscription @ sat 0</h3>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              The mint inscription must occupy satoshi offset{" "}
              <code className="font-mono text-[var(--lime)]">0</code> of the carrier output.
              Builders abort pre-broadcast on mismatch.
            </p>
          </div>
          <div className="panel-y2k">
            <p className="font-pixel text-[0.55rem] text-[var(--lime)]">invariant · identity</p>
            <h3 className="chrome-text mt-3 text-xl">Case-folded ticker</h3>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              <code className="font-mono text-[var(--pink)]">SATDUST</code> / satdust / SatDust
              collapse to one identity. First valid deploy wins permanently.
            </p>
          </div>
        </section>

        <hr className="rule" />

        <section className="panel-chrome">
          <span className="pill pill-lime">deploy schema</span>
          <h2 className="hologram-text mt-4 text-3xl sm:text-4xl">Canonical issuance object</h2>
          <p className="mt-3 max-w-2xl text-[var(--ink-dim)]">
            Deploy locks the sat-binding constants.{" "}
            <code className="font-mono text-[var(--cyan)]">max_sats</code> is not free-form — it is
            constrained by <code className="font-mono text-[var(--cyan)]">supply × unit_sats</code>.
          </p>
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
            assert(max_sats == supply × unit_sats) → {SUPPLY} × {UNIT_SATS} = {MAX_SATS}
          </p>
        </section>

        <hr className="rule" />

        <section>
          <span className="pill pill-chrome">execution model</span>
          <h2 className="chrome-text mt-4 text-3xl sm:text-4xl">Transfer without a transfer opcode</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--cyan)]">allocation</p>
              <p className="mt-3 text-sm text-[var(--ink-dim)]">
                Asset movement is derived from ordinary Bitcoin spends. Input sat ranges are
                ordered into outputs; DUST units ride those ranges. There is no{" "}
                <code className="font-mono text-[var(--pink)]">op:transfer</code> message.
              </p>
            </div>
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--pink)]">danger zone</p>
              <p className="mt-3 text-sm text-[var(--ink-dim)]">
                Wallet UTXO selection and change layout decide whether balances survive a spend.
                Colored inputs (Ordinals / Runes / BRC-20 / DUST) must never be selected as funding inputs.
              </p>
            </div>
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--lime)]">commit / reveal</p>
              <p className="mt-3 text-sm text-[var(--ink-dim)]">
                Inscriptions use a two-phase envelope. Reveal constructs the carrier output and
                embeds the mint JSON. Pre-broadcast asserts enforce carrier value and offset.
              </p>
            </div>
            <div className="panel-y2k">
              <p className="font-pixel text-[0.55rem] text-[var(--cyan)]">state oracle</p>
              <p className="mt-3 text-sm text-[var(--ink-dim)]">
                Databases are caches. Confirmed L1 + DUST-20 indexer acceptance is the only
                acceptance criterion. RBF and reorgs force re-evaluation.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section className="panel-y2k">
          <span className="pill pill-pink">verification predicates</span>
          <h2 className="chrome-text mt-4 text-3xl">Acceptance checklist</h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 font-mono text-lg text-[var(--ink-dim)]">
            <li className="text-[var(--cyan)]">mainnet tx exists ∧ confirms</li>
            <li>inscription payload: p=dust-20 ∧ op=mint ∧ tick≡SATDUST</li>
            <li>amt × unit_sats == sats</li>
            <li>carrier.vout.value == sats</li>
            <li>inscription.offset == 0</li>
            <li>deploy exists ∧ cumulative supply not exceeded</li>
            <li>indexer.accept(mint) == true</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/verify" className="btn btn-solid">
              Run verifier
            </Link>
            <Link href="/docs" className="btn btn-ghost">
              Full docs
            </Link>
          </div>
        </section>

        <div className="footnote">
          Spec reference: DUST-20 v1.1.0 (2026-09-01), Bitcoin mainnet, Experimental. Ticker
          vacancy must be re-checked against an authoritative index before deploy.
        </div>
      </div>
    </div>
  );
}
