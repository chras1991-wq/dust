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
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">Laboratory · Proof</p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl md:text-7xl">Prove</h1>
      <p className="deck mt-4">
        Paste a txid. We check carrier sats, offset, and DUST-20 mint shape. Chain + indexer still
        have the final say.
      </p>

      <form onSubmit={onSubmit} className="panel-edit mt-8 space-y-4 sm:mt-10">
        <label className="block">
          <span className="byline">TXID</span>
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
            <span className="byline">Carrier sats</span>
            <input className="input mt-2" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </label>
          <label className="block">
            <span className="byline">Offset</span>
            <input className="input mt-2" value={offset} onChange={(e) => setOffset(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="btn btn-solid" disabled={busy}>
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-[var(--invalid)]">{error}</p>}

      {result && (
        <div className="panel-edit mt-8">
          <p className={result.valid ? "status-confirmed" : "status-invalid"}>
            {result.summary}
          </p>
          <ul className="mt-6 space-y-3">
            {result.checks.map((c) => (
              <li key={c.id} className="flex gap-3 font-sans text-sm">
                <span className={c.pass ? "status-confirmed" : "status-invalid"}>
                  {c.pass ? "Pass" : "Fail"}
                </span>
                <span>
                  <span className="text-[var(--ink)]">{c.label}</span>
                  {c.detail && (
                    <span className="mt-0.5 block text-[var(--ink-mute)]">{c.detail}</span>
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
    <Suspense fallback={<div className="page-shell py-14 text-[var(--ink-mute)]">Loading…</div>}>
      <VerifyForm />
    </Suspense>
  );
}
