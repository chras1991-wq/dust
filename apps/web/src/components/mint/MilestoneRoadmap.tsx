"use client";

import { useEffect, useState } from "react";
import {
  VOTE_BTC_THRESHOLD,
  VOTE_PERIOD_DAYS,
  REVOTE_COOLDOWN_DAYS,
} from "@satdust/shared";

type Goal = {
  id: string;
  label: string;
  kind: string;
  target?: number;
  formula: string;
  current: number;
  met: boolean;
  options?: string[];
  optionMet?: boolean[];
  need?: number;
};

type Stage = {
  id: string;
  code: string;
  title: string;
  blurb: string;
  amount: number;
  supplyAfter: number;
  isGenesis: boolean;
  status: string;
  goals: Goal[];
  goalsComplete: boolean;
  goalsMetCount: number;
  goalsTotal: number;
  quorum: number;
  approval: number;
  cooldownDays: number;
  mintedAt?: string;
  voteYes?: number;
  voteNo?: number;
  dilution: number | null;
  supplyIfApproved: number;
};

export function MilestoneRoadmap({
  stages,
  current,
  minted,
  formula,
  tagline,
}: {
  stages: Stage[];
  current: Stage;
  minted: number;
  formula: string;
  tagline: string;
}) {
  const [selectedId, setSelectedId] = useState(current.id);
  // Keep selection on the live current stage when data refreshes (never jump ahead).
  useEffect(() => {
    setSelectedId(current.id);
  }, [current.id]);
  const selected = stages.find((s) => s.id === selectedId) ?? current;
  const canPropose =
    !selected.isGenesis &&
    (selected.status === "REACHED" ||
      (selected.status === "IN_PROGRESS" && selected.goalsComplete));

  return (
    <section className="mt-14 border-t-[1.5px] border-[var(--ink)] pt-10 sm:mt-16 sm:pt-12">
      <p className="byline">03 · Milestone issuance</p>
      <h2 className="font-display mt-2 text-[1.85rem] leading-tight sm:text-4xl">
        Community-approved supply
      </h2>
      <p className="deck mt-3 max-w-2xl">{tagline}</p>
      <p className="mt-3 font-mono text-xs text-[var(--ink-mute)] sm:text-sm">{formula}</p>
      <p className="mt-2 font-sans text-sm text-[var(--ink-soft)]">
        Genesis {stages[0]?.amount.toLocaleString()} open at launch. Remaining 8,000 only via
        milestones + vote. Completing a milestone unlocks proposal capacity — it does not mint.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,14rem)_1fr] lg:gap-10">
        {/* Vertical timeline */}
        <ol className="milestone-rail relative space-y-0">
          {stages.map((s, i) => {
            const active = s.id === selected.id;
            const done = s.status === "MINTED";
            const currentish =
              s.status === "IN_PROGRESS" || s.status === "REACHED" || s.status === "VOTING";
            return (
              <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
                {i < stages.length - 1 && (
                  <span
                    className={`milestone-stem absolute left-[0.7rem] top-7 h-[calc(100%-0.5rem)] w-px ${
                      done ? "bg-[var(--valid)]" : "bg-[rgba(17,17,17,0.2)]"
                    }`}
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`relative z-[1] flex min-h-11 w-full items-start gap-3 rounded-none border px-2 py-2 text-left transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-white"
                      : "border-transparent hover:border-[rgba(17,17,17,0.2)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border text-[0.65rem] font-condensed ${
                      done
                        ? "border-[var(--valid)] bg-[var(--valid)] text-white"
                        : currentish
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-[var(--ink-mute)] text-[var(--ink-mute)]"
                    }`}
                    style={{
                      width: `${1.35 + Math.min(s.amount / 2800, 1) * 0.55}rem`,
                      height: `${1.35 + Math.min(s.amount / 2800, 1) * 0.55}rem`,
                    }}
                  >
                    {done ? "✓" : currentish ? "●" : "○"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <span className="font-condensed text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
                        {s.code} · {s.title}
                      </span>
                      <span
                        className={`font-mono text-[0.7rem] ${
                          currentish ? "text-[var(--accent)]" : "text-[var(--ink)]"
                        }`}
                      >
                        +{s.amount.toLocaleString()}
                      </span>
                    </span>
                    <span className="mt-0.5 block font-condensed text-[0.65rem] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
                      {statusLabel(s.status)}
                      {s.mintedAt ? ` · ${s.mintedAt}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Detail panel */}
        <div className="panel-edit">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="kicker">
                Milestone {selected.code}
                {selected.id === current.id ? " · Current" : ""}
              </p>
              <h3 className="font-display mt-1 text-3xl sm:text-4xl">{selected.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{selected.blurb}</p>
            </div>
            <p className="font-display text-2xl text-[var(--accent)] sm:text-3xl">
              +{selected.amount.toLocaleString()}
            </p>
          </div>

          {!selected.isGenesis && (
            <div className="mt-6 space-y-4">
              <p className="byline">
                Goals {selected.goalsMetCount}/{selected.goalsTotal}
              </p>
              {selected.goals.map((g) => (
                <GoalRow key={g.id} goal={g} />
              ))}
            </div>
          )}

          {selected.isGenesis && (
            <div className="mt-6 space-y-4">
              <div className="border-b border-[rgba(17,17,17,0.1)] pb-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--ink-soft)]">Genesis mint progress</span>
                  <span className="status-pending">
                    {minted.toLocaleString()} / {selected.amount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-[rgba(17,17,17,0.1)]">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{
                      width: `${Math.min(100, (minted / selected.amount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              {selected.goals.map((g) => (
                <GoalRow key={g.id} goal={g} />
              ))}
              <p className="text-sm text-[var(--ink-soft)]">
                Open at launch — no community vote for the first {selected.amount.toLocaleString()}{" "}
                units. Later stages stay locked until this window fills and their goals are met.
              </p>
            </div>
          )}

          {!selected.isGenesis && (
            <div className="mt-8 border border-[var(--ink)] bg-[var(--paper)] p-4 sm:p-5">
              <p className="byline">Issuance &amp; governance</p>
              <p className="font-display mt-2 text-2xl">
                Unlock proposal capacity:{" "}
                <span className="text-[var(--accent)]">+{selected.amount.toLocaleString()} SATDUST</span>
              </p>
              <p className="mt-2 text-sm text-[var(--ink-mute)]">
                Reaching the milestone does not create new SATDUST. Holders must approve a mint
                proposal.
              </p>

              <dl className="mt-5 grid gap-2 font-sans text-sm sm:grid-cols-2">
                <Row label="Current supply" value={minted.toLocaleString()} />
                <Row label="Proposed issuance" value={`+${selected.amount.toLocaleString()}`} />
                <Row
                  label="If approved"
                  value={`${selected.supplyIfApproved.toLocaleString()} / 10,000`}
                />
                <Row
                  label="Dilution from proposal"
                  value={
                    selected.dilution != null ? `+${selected.dilution.toFixed(2)}%` : "—"
                  }
                  accent
                />
              </dl>

              <button
                type="button"
                className="btn btn-solid mt-6"
                disabled={!canPropose || selected.status === "MINTED" || selected.status === "LOCKED"}
              >
                {selected.status === "MINTED"
                  ? "Already minted"
                  : selected.status === "VOTING"
                    ? "Voting in progress"
                    : "Submit Mint Proposal"}
              </button>
              <p className="mt-2 font-sans text-xs text-[var(--ink-mute)]">
                {selected.status === "LOCKED"
                  ? "Prior milestones must mint first."
                  : selected.status === "MINTED"
                    ? `Minted${selected.mintedAt ? ` ${selected.mintedAt}` : ""}. Cooldown ${selected.cooldownDays}d before next proposal.`
                    : canPropose
                      ? "Milestone goals met — proposal can be submitted."
                      : "Only when all milestone goals are met can a proposal be submitted."}
              </p>
            </div>
          )}

          {!selected.isGenesis && (
            <aside className="mt-6 border-t border-[rgba(17,17,17,0.15)] pt-5">
              <p className="byline">Voting rules</p>
              <ul className="mt-3 space-y-1.5 font-sans text-sm text-[var(--ink-soft)]">
                <li>
                  Qualification: BTC balance ≥ {VOTE_BTC_THRESHOLD} BTC at snapshot
                </li>
                <li>Power: 1 eligible wallet = 1 vote</li>
                <li>Quorum: ≥ {Math.round(selected.quorum * 100)}% of eligible wallets</li>
                <li>Approval: ≥ {Math.round(selected.approval * 100)}% YES</li>
                <li>Voting period: {VOTE_PERIOD_DAYS} days</li>
                <li>If rejected: re-propose after {REVOTE_COOLDOWN_DAYS} days</li>
                <li>Post-mint cooldown: {selected.cooldownDays} days</li>
              </ul>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  if (goal.kind === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(17,17,17,0.1)] pb-3">
        <span className="text-sm text-[var(--ink-soft)]">{goal.label}</span>
        <span className={goal.met ? "status-confirmed" : "status-pending"}>
          {goal.met ? "Met" : "Open"}
        </span>
      </div>
    );
  }

  if (goal.kind === "any_of") {
    const metCount = goal.optionMet?.filter(Boolean).length ?? 0;
    const need = goal.need ?? 2;
    return (
      <div className="border-b border-[rgba(17,17,17,0.1)] pb-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--ink-soft)]">{goal.label}</span>
          <span className={goal.met ? "status-confirmed" : "status-pending"}>
            {metCount}/{need}
          </span>
        </div>
        <ul className="mt-2 space-y-1 font-mono text-[0.7rem] text-[var(--ink-mute)]">
          {goal.options?.map((opt, i) => (
            <li key={opt}>
              {goal.optionMet?.[i] ? "✓" : "○"} {opt}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const target = goal.target ?? 1;
  const inverse = goal.kind === "inverse_ratio";
  const pct = inverse
    ? Math.min(100, (target / Math.max(goal.current, 0.01)) * 100)
    : Math.min(100, (goal.current / target) * 100);
  const display = inverse
    ? `${goal.current}% / ≤${target}%`
    : `${goal.current.toLocaleString()} / ${target.toLocaleString()}`;

  return (
    <div className="border-b border-[rgba(17,17,17,0.1)] pb-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--ink-soft)]">{goal.label}</span>
        <span className={goal.met ? "status-confirmed" : "status-pending"}>
          {goal.met ? "Met" : display}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-[rgba(17,17,17,0.1)]">
        <div
          className={`h-full ${goal.met ? "bg-[var(--valid)]" : "bg-[var(--accent)]"}`}
          style={{ width: `${inverse && goal.met ? 100 : pct}%` }}
        />
      </div>
      <p className="mt-1 font-mono text-[0.65rem] text-[var(--ink-mute)]">
        {goal.formula}
        {!goal.met && !inverse ? ` · ${display}` : ""}
        {!goal.met && inverse ? ` · now ${goal.current}%` : ""}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[rgba(17,17,17,0.08)] py-1.5">
      <dt className="text-[var(--ink-mute)]">{label}</dt>
      <dd className={accent ? "font-display text-[var(--accent)]" : "text-[var(--ink)]"}>{value}</dd>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "MINTED":
      return "Minted";
    case "IN_PROGRESS":
      return "In progress";
    case "REACHED":
      return "Reached";
    case "VOTING":
      return "Voting";
    case "REJECTED":
      return "Rejected";
    default:
      return "Locked";
  }
}
