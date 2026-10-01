"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useDeskWallet } from "@/hooks/useDeskWallet";

const TEMPLATES = [
  {
    id: "rebalancer",
    name: "Rebalancer",
    blurb: "Watches carrier UTXOs and asks for a PSBT if a spend would break the 546-sat lock.",
    bond: 10,
    mode: "PSBT only",
  },
  {
    id: "whitelist",
    name: "Whitelist scout",
    blurb: "Reads who is on the contributors list for the next milestone mint. No spend.",
    bond: 5,
    mode: "Read only",
  },
  {
    id: "mint-watch",
    name: "Mint watch",
    blurb: "Flags when a milestone gate flips or a holder vote opens.",
    bond: 5,
    mode: "Read only",
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

type DeployedAgent = {
  id: string;
  templateId: TemplateId;
  name: string;
  bond: number;
  mode: string;
  createdAt: number;
};

export default function AgentPage() {
  const { account, setAccount, balance, btcSats, openWallet, registerOpen } = useDeskWallet();
  const [templateId, setTemplateId] = useState<TemplateId>(TEMPLATES[0].id);
  const [name, setName] = useState("");
  const [bondInput, setBondInput] = useState(String(TEMPLATES[0].bond));
  const [review, setReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<DeployedAgent[]>([]);

  const template = TEMPLATES.find((row) => row.id === templateId) ?? TEMPLATES[0];
  const bond = Math.floor(Number(bondInput));
  const bondOk = Number.isFinite(bond) && bond >= template.bond;
  const nameOk = /^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$/i.test(name.trim());

  useEffect(() => {
    setDeployed(readAgents(account?.address));
    setReview(false);
    setError(null);
  }, [account?.address]);

  function selectTemplate(id: TemplateId) {
    const next = TEMPLATES.find((row) => row.id === id) ?? TEMPLATES[0];
    setTemplateId(next.id);
    setBondInput((current) => {
      const n = Math.floor(Number(current));
      if (!Number.isFinite(n) || n < next.bond) return String(next.bond);
      return current;
    });
    setReview(false);
  }

  function requestDeploy() {
    setError(null);
    if (!account) {
      openWallet();
      return;
    }
    if (!nameOk) {
      setError("Call sign needs 3–24 letters, numbers, or hyphens.");
      return;
    }
    if (!bondOk) {
      setError(`${template.name} needs at least ${template.bond} SATDUST bonded.`);
      return;
    }
    if (balance != null && bond > balance) {
      setError(`This wallet holds ${balance.toLocaleString()} SATDUST.`);
      return;
    }
    if (deployed.some((row) => row.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("That call sign is already on this desk.");
      return;
    }
    setReview(true);
  }

  function confirmDeploy() {
    if (!account || !nameOk || !bondOk) return;
    const next: DeployedAgent = {
      id: `${Date.now().toString(36)}-${template.id}`,
      templateId: template.id,
      name: name.trim(),
      bond,
      mode: template.mode,
      createdAt: Date.now(),
    };
    const saved = [next, ...readAgents(account.address)];
    writeAgents(account.address, saved);
    setDeployed(saved);
    setReview(false);
    setName("");
  }

  return (
    <div className="page-shell max-w-5xl py-10 sm:py-14">
      <p className="byline">
        <Link href="/explorer" className="no-underline hover:text-[var(--accent)]">
          Index
        </Link>{" "}
        · 02 · Agent desk
      </p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl">Deploy agent</h1>
      <p className="deck mt-3 max-w-2xl text-[0.95rem] sm:mt-4 sm:text-[1.05rem]">
        Put an agent on your SATDUST UTXOs. Keys stay in the wallet. The agent can only ask for a
        signature.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
        <div>
          <div className="panel-edit space-y-4">
            <p className="font-sans text-xs text-[var(--ink-mute)] sm:text-sm">
              Deployed{" "}
              <span className="font-display text-lg text-[var(--ink)] tabular-nums">
                {deployed.length}
              </span>
              <span className="text-[var(--ink-mute)]"> on this desk</span>
              {account && balance != null && (
                <span className="hidden sm:inline"> · {balance.toLocaleString()} SATDUST</span>
              )}
            </p>

            <div>
              <p className="byline">Template</p>
              <ul className="mt-2 space-y-2">
                {TEMPLATES.map((row) => {
                  const on = row.id === templateId;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => selectTemplate(row.id)}
                        className={`w-full border px-4 py-3 text-left ${
                          on
                            ? "border-[var(--accent)] bg-white"
                            : "border-[var(--ink)] bg-transparent hover:border-[var(--accent)]"
                        }`}
                      >
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-display text-xl">{row.name}</span>
                          <span className="font-sans text-xs text-[var(--ink-mute)]">
                            bond {row.bond} · {row.mode}
                          </span>
                        </span>
                        <span className="mt-1 block font-sans text-sm text-[var(--ink-mute)]">
                          {row.blurb}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <label className="block">
              <span className="byline">Call sign</span>
              <input
                className="input mt-2"
                autoComplete="off"
                placeholder="desk-watch"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24))}
              />
            </label>

            <label className="block">
              <span className="byline">Bond (SATDUST)</span>
              <input
                className="input mt-2"
                inputMode="numeric"
                autoComplete="off"
                value={bondInput}
                onChange={(e) => setBondInput(e.target.value.replace(/\D/g, ""))}
              />
              <span className="mt-1 block font-sans text-xs text-[var(--ink-mute)]">
                Minimum {template.bond} for {template.name}.
              </span>
            </label>

            <WalletConnect
              headlessUntilConnected
              balanceText={account ? formatBtc(btcSats) : null}
              onAccount={(acc) => setAccount(acc)}
              registerOpen={registerOpen}
            />

            <button type="button" className="btn btn-solid w-full sm:w-auto" onClick={requestDeploy}>
              {account ? "Review deploy" : "Connect & deploy"}
            </button>
          </div>

          {error && <p className="mt-4 font-sans text-sm text-[var(--invalid)]">{error}</p>}

          {review && account && nameOk && bondOk && (
            <div className="panel-edit mt-4 space-y-3 border-[var(--accent)]">
              <p className="kicker">Confirm deploy</p>
              <p className="font-display text-3xl">{name.trim()}</p>
              <p className="font-sans text-sm text-[var(--ink-soft)]">
                {template.name} · {template.mode} · bond {bond.toLocaleString()} SATDUST · wallet{" "}
                {shortAddress(account.address)}. The agent is queued on this desk. It cannot move
                coins. A spend, if the template allows one, still needs your PSBT signature.
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn-solid" onClick={confirmDeploy}>
                  Deploy {name.trim()}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setReview(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <section className="mt-8">
            <p className="byline">Fleet</p>
            {deployed.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-[var(--ink-mute)]">
                {account ? "No agent deployed from this wallet yet." : "Connect a wallet to see its agents."}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-[var(--ink)]/15 border-t border-[var(--ink)]/20 font-sans text-sm">
                {deployed.map((row) => {
                  const label = TEMPLATES.find((item) => item.id === row.templateId)?.name ?? row.templateId;
                  return (
                    <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                      <span className="text-[var(--ink)]">
                        {row.name}
                        <span className="text-[var(--ink-mute)]"> · {label}</span>
                      </span>
                      <span className="text-right text-xs text-[var(--ink-mute)]">
                        <span className="status-pending">Queued</span>
                        {" · "}
                        bond {row.bond.toLocaleString()} · {row.mode}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="panel-edit space-y-4">
          <p className="kicker">Deploy</p>
          <h2 className="font-display text-3xl">The wallet still signs</h2>
          <ul className="space-y-3 font-sans text-sm text-[var(--ink-soft)]">
            <li>Read-only agents never ask for a transaction.</li>
            <li>Rebalancer can draft a PSBT. You approve it in the wallet, or you do not.</li>
            <li>The bond is SATDUST this wallet already holds. It is not sent to a new address.</li>
            <li>Call signs are unique per wallet on this desk.</li>
          </ul>
          <p className="font-sans text-sm text-[var(--ink-mute)]">
            Weight for later gates lives on the <Link href="/stake">stake desk</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}

function formatBtc(sats: number | null): string {
  if (sats == null) return "BTC …";
  return `${(sats / 100_000_000).toFixed(8)} BTC`;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function storageKey(address: string): string {
  return `satdust:agent:v1:${address.toLowerCase()}`;
}

function readAgents(address: string | undefined): DeployedAgent[] {
  if (!address || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    const parsed = raw ? (JSON.parse(raw) as DeployedAgent[]) : [];
    return Array.isArray(parsed) ? parsed.filter((row) => row && row.name) : [];
  } catch {
    return [];
  }
}

function writeAgents(address: string, rows: DeployedAgent[]) {
  window.localStorage.setItem(storageKey(address), JSON.stringify(rows.slice(0, 40)));
}
