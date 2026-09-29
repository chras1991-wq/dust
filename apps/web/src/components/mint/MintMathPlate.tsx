import { GENESIS_SUPPLY, SUPPLY, UNIT_SATS } from "@satdust/shared";

/** One editorial math plate for the mint desk — display type, not mono dump. */
export function MintMathPlate() {
  return (
    <section className="math-plate mt-12 sm:mt-14" aria-label="Issuance equation">
      <div className="math-plate__inner">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-condensed text-[0.72rem] uppercase tracking-[0.18em] text-[var(--accent-soft)]">
            Fig. M · Mint math
          </p>
          <p className="font-condensed text-[0.68rem] uppercase tracking-[0.14em] text-[rgba(243,241,236,0.45)]">
            DUST-20 · L1
          </p>
        </div>

        <p className="font-display mt-6 text-[clamp(1.65rem,5.5vw,2.75rem)] italic leading-[1.2] text-[var(--paper)]">
          S = {GENESIS_SUPPLY.toLocaleString()} +{" "}
          <span className="text-[var(--accent-soft)]">Σ</span>
          <span className="relative -top-2 font-display text-[0.55em] not-italic">i</span>
          &nbsp;A
          <span className="relative -top-2 font-display text-[0.55em] not-italic">i</span>
          · 𝟙
          <span className="font-display text-[0.85em] not-italic text-[var(--accent-soft)]">
            [M·Q·V]
          </span>
        </p>

        <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-[rgba(243,241,236,0.72)]">
          New slots open only if the milestone is done and the vote passes. Genesis is the only
          free window.
        </p>

        <div className="math-plate__rule" />

        <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-end">
          <div>
            <p className="font-condensed text-[0.68rem] uppercase tracking-[0.16em] text-[var(--accent-soft)]">
              UTXO rule
            </p>
            <p className="font-display mt-2 text-[clamp(1.25rem,4vw,1.85rem)] italic leading-snug text-[var(--paper)]">
              vout = {UNIT_SATS}
              <span className="mx-2 text-[var(--accent-soft)]">∧</span>
              offset = 0
            </p>
          </div>
          <div className="font-display text-right text-[clamp(2.5rem,10vw,4rem)] italic leading-none text-[var(--accent)]">
            {SUPPLY.toLocaleString()}
            <span className="mt-1 block font-condensed text-[0.55rem] not-italic uppercase tracking-[0.2em] text-[rgba(243,241,236,0.4)]">
              hard cap
            </span>
          </div>
        </div>

        <pre className="math-plate__flow" aria-hidden>
{`mint JSON ──► ${UNIT_SATS}-sat UTXO ──► indexer 𝟙 ──► 1 SATDUST
                 │
                 └─ sats stay with the token`}
        </pre>
      </div>
    </section>
  );
}
