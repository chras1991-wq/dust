"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UNIT_SATS } from "@satdust/shared";

type VerifyResult = {
  valid: boolean;
  summary: string;
  checks: Array<{ id: string; label: string; pass: boolean; detail?: string }>;
};

function VerifyForm() {
  const search = useSearchParams();
  const [txid, setTxid] = useState("");
  const [carrier, setCarrier] = useState(String(UNIT_SATS));
  const [offset, setOffset] = useState("0");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = search.get("txid");
    if (q) setTxid(q);
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txid: txid.trim(),
          carrierOutputSats: Number(carrier),
          inscriptionOffset: Number(offset),
          payload: {
            p: "dust-20",
            op: "mint",
            tick: "SATDUST",
            amt: "1",
            sats: "546",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verify failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-lime">truth machine</span>
      <h1 className="hologram-text hero-title mt-4 text-6xl sm:text-7xl">CHECK</h1>
      <p className="mt-3 text-[var(--ink-dim)]">
        Structural DUST-20 checks. Final word = confirmed chain + indexer.
      </p>

      <form onSubmit={onSubmit} className="panel-y2k mt-8 space-y-4">
        <label className="block">
          <span className="font-pixel text-[0.55rem] text-[var(--pink)]">txid</span>
          <input
            className="input mt-2"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder="64-character hex transaction id"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-pixel text-[0.55rem] text-[var(--cyan)]">carrier sats</span>
            <input className="input mt-2" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </label>
          <label className="block">
            <span className="font-pixel text-[0.55rem] text-[var(--lime)]">offset</span>
            <input className="input mt-2" value={offset} onChange={(e) => setOffset(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="btn btn-solid" disabled={busy}>
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>

      {error && <p className="mt-4 font-pixel text-[0.55rem] text-[var(--invalid)]">{error}</p>}

      {result && (
        <div className="panel-y2k mt-8">
          <p className={`font-pixel text-[0.7rem] ${result.valid ? "status-confirmed" : "status-invalid"}`}>
            {result.summary}
          </p>
          <ul className="mt-6 space-y-3">
            {result.checks.map((c) => (
              <li key={c.id} className="flex gap-3 font-mono text-lg">
                <span className={`pill ${c.pass ? "pill-lime" : "pill-pink"}`}>
                  {c.pass ? "pass" : "fail"}
                </span>
                <span>
                  <span className="text-[var(--ink)]">{c.label}</span>
                  {c.detail && (
                    <span className="mt-0.5 block text-[var(--ink-dim)]">{c.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-[var(--ink-dim)]">Loading…</div>}>
      <VerifyForm />
    </Suspense>
  );
}
