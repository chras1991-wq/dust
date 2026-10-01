"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { WalletConnect } from "@/components/WalletConnect";
import { MarketCanvas } from "@/components/MarketCanvas";
import { fetchConfirmedBtcSats } from "@/lib/btc-pay";
import {
  executeIndexSwap,
  quoteUnitsToBtcSats,
} from "@/lib/index-swap-pay";
import {
  executeSatdustTransfer,
  loadWalletInscriptionLots,
  type TransferLot,
} from "@/lib/transfer-pay";

type MarketPayload = {
  u: number;
  s: number;
  b: Array<{ t: number; o: number; h: number; l: number; c: number }>;
};

export function PortalDesk() {
  const [account, setAccount] = useState<Account | null>(null);
  const [adapter, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [market, setMarket] = useState<MarketPayload | null>(null);
  const [payQty, setPayQty] = useState("1");
  const [recvBtc, setRecvBtc] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [lots, setLots] = useState<TransferLot[]>([]);
  const [btcSats, setBtcSats] = useState<number | null>(null);
  const [mode, setMode] = useState<"x" | "t">("x");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletOpenRef = useRef<(() => void) | null>(null);

  const refreshMarket = useCallback(async () => {
    const res = await fetch("/api/market", { cache: "no-store" });
    const data = (await res.json()) as MarketPayload;
    if (res.ok) setMarket(data);
  }, []);

  const refreshHoldings = useCallback(async (address: string, ad: BitcoinWalletAdapter | null) => {
    const res = await fetch(`/api/wallet/holdings?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "—");
    let mergedLots = (data.lots ?? []) as TransferLot[];
    if (ad) {
      try {
        const walletLots = await loadWalletInscriptionLots(ad);
        if (walletLots.length > 0) mergedLots = walletLots;
      } catch {
        /* optional */
      }
    }
    const walletUnits = mergedLots.filter((l) => l.inscriptionId).reduce((s, l) => s + l.amount, 0);
    setBalance(Math.max(data.balance ?? 0, walletUnits));
    setLots(mergedLots);
  }, []);

  useEffect(() => {
    void refreshMarket();
    const id = setInterval(() => void refreshMarket(), 60_000);
    return () => clearInterval(id);
  }, [refreshMarket]);

  useEffect(() => {
    if (!account) {
      setBalance(null);
      setLots([]);
      setBtcSats(null);
      return;
    }
    void refreshHoldings(account.address, adapter).catch(() => setBalance(null));
    void fetchConfirmedBtcSats(account.address).then(setBtcSats).catch(() => setBtcSats(null));
  }, [account, adapter, refreshHoldings]);

  const qty = Math.floor(Number(payQty) || 0);
  const satsPerUnit = market?.s ?? 0;

  const outSats = useMemo(() => {
    if (!satsPerUnit || qty <= 0) return 0;
    return quoteUnitsToBtcSats(qty, satsPerUnit);
  }, [qty, satsPerUnit]);

  useEffect(() => {
    if (mode !== "x") return;
    setRecvBtc(outSats > 0 ? (outSats / 1e8).toFixed(8) : "");
  }, [mode, outSats]);

  const canX =
    account &&
    adapter &&
    qty > 0 &&
    satsPerUnit > 0 &&
    balance != null &&
    qty <= balance &&
    btcSats != null &&
    btcSats >= 546;

  const canT =
    account &&
    adapter &&
    qty > 0 &&
    balance != null &&
    qty <= balance &&
    /^bc1[a-z0-9]{25,87}$/i.test(toAddress.trim()) &&
    toAddress.trim().toLowerCase() !== account.address.toLowerCase();

  async function onConfirm() {
    if (!account || !adapter) return;
    setBusy(true);
    setError(null);
    setConfirmOpen(false);
    try {
      if (mode === "x") {
        if (!canX) return;
        await executeIndexSwap({
          account,
          adapter,
          satdustAmount: qty,
          satsPerUnit,
        });
      } else {
        if (!canT) return;
        await executeSatdustTransfer({
          account,
          adapter,
          recipient: toAddress.trim(),
          satdustAmount: qty,
          lots,
        });
      }
      await refreshHoldings(account.address, adapter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "—");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-edit">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[12rem] flex-1">
          <MarketCanvas bars={market?.b ?? []} />
        </div>
        <WalletConnect
          onAccount={(acc, ad) => {
            setAccount(acc);
            setAdapter(ad);
          }}
          registerOpen={(open) => {
            walletOpenRef.current = open;
          }}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <input
          className="input w-full"
          inputMode="numeric"
          value={payQty}
          onChange={(e) => setPayQty(e.target.value)}
          aria-label="a"
        />
        {mode === "x" ? (
          <input className="input w-full font-mono text-sm" readOnly value={recvBtc} aria-label="b" />
        ) : (
          <input
            className="input w-full font-mono text-sm sm:col-span-2"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            aria-label="c"
            autoComplete="off"
            spellCheck={false}
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn flex-1 ${mode === "x" ? "btn-solid" : "btn-ghost"}`}
            onClick={() => setMode("x")}
            aria-label="m1"
          >
            ⇄
          </button>
          <button
            type="button"
            className={`btn flex-1 ${mode === "t" ? "btn-solid" : "btn-ghost"}`}
            onClick={() => setMode("t")}
            aria-label="m2"
          >
            →
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--invalid)]">{error}</p>}

      <div className="btn-row mt-6">
        {!account ? (
          <button type="button" className="btn btn-solid" onClick={() => walletOpenRef.current?.()}>
            ◉
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-solid"
            disabled={busy || (mode === "x" ? !canX : !canT)}
            onClick={() => setConfirmOpen(true)}
          >
            {busy ? "…" : "✓"}
          </button>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet w-full sm:max-w-md">
            <div className="btn-row">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                ←
              </button>
              <button type="button" className="btn btn-solid" onClick={() => void onConfirm()}>
                ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
