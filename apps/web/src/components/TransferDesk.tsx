"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Account, BitcoinWalletAdapter } from "@satdust/wallet";
import { WalletConnect } from "@/components/WalletConnect";
import { fetchConfirmedBtcSats } from "@/lib/btc-pay";
import {
  executeSatdustTransfer,
  type TransferLot,
  type TransferPayProgress,
} from "@/lib/transfer-pay";

const PROGRESS_LABEL: Record<TransferPayProgress, string> = {
  selecting: "Selecting carrier inscriptions…",
  awaiting_wallet: "Confirm the inscription transfer in your wallet…",
  broadcasting: "Broadcasting transfer…",
  done: "Transfer submitted",
};

export function TransferDesk() {
  const [account, setAccount] = useState<Account | null>(null);
  const [adapter, setAdapter] = useState<BitcoinWalletAdapter | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("1");
  const [balance, setBalance] = useState<number | null>(null);
  const [lots, setLots] = useState<TransferLot[]>([]);
  const [btcSats, setBtcSats] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<TransferPayProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ txids: string[]; notice: string } | null>(null);
  const walletOpenRef = useRef<(() => void) | null>(null);

  const refreshHoldings = useCallback(async (address: string) => {
    const res = await fetch(`/api/wallet/holdings?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load SATDUST balance");
    setBalance(data.balance ?? 0);
    setLots((data.lots ?? []) as TransferLot[]);
  }, []);

  const refreshBtc = useCallback(async (address: string) => {
    try {
      const sats = await fetchConfirmedBtcSats(address);
      setBtcSats(sats);
    } catch {
      setBtcSats(null);
    }
  }, []);

  useEffect(() => {
    if (!account) {
      setBalance(null);
      setLots([]);
      setBtcSats(null);
      return;
    }
    void refreshHoldings(account.address).catch((e) =>
      setError(e instanceof Error ? e.message : "Balance unavailable")
    );
    void refreshBtc(account.address);
  }, [account, refreshHoldings, refreshBtc]);

  const qty = Math.floor(Number(amount) || 0);
  const canSend =
    account &&
    adapter &&
    qty > 0 &&
    balance != null &&
    qty <= balance &&
    /^bc1[a-z0-9]{25,87}$/i.test(recipient.trim()) &&
    recipient.trim().toLowerCase() !== account.address.toLowerCase();

  async function onConfirm() {
    if (!account || !adapter || !canSend) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setConfirmOpen(false);
    try {
      const res = await executeSatdustTransfer({
        account,
        adapter,
        recipient: recipient.trim(),
        satdustAmount: qty,
        lots,
        onProgress: setProgress,
      });
      setResult({ txids: res.txids, notice: res.notice });
      await refreshHoldings(account.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="panel-edit">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker">Transfer desk</p>
          <h2 className="font-display mt-2 text-3xl sm:text-4xl">Send SATDUST</h2>
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

      <p className="mt-4 max-w-2xl text-sm text-[var(--ink-mute)]">
        Bind a Bitcoin mainnet wallet (browser extension or WalletConnect via Privy). SATDUST moves
        when you spend the carrier inscription UTXO — there is no separate transfer opcode. Never
        paste a seed phrase, private key, or WIF on this site.
      </p>

      <div className="stat-strip mt-6 grid gap-3 sm:grid-cols-2">
        <Meta
          label="SATDUST (indexed)"
          value={balance == null ? "—" : `${balance.toLocaleString()} SATDUST`}
        />
        <Meta
          label="BTC for fees"
          value={btcSats == null ? "—" : `${(btcSats / 1e8).toFixed(8)} BTC`}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="byline">Amount</span>
          <input
            className="input mt-2 w-full"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="byline">Recipient (bc1…)</span>
          <input
            className="input mt-2 w-full font-mono text-sm"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="bc1…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      {progress && (
        <p className="mt-4 text-sm text-[var(--accent)]">{PROGRESS_LABEL[progress]}</p>
      )}
      {error && <p className="mt-4 text-sm text-[var(--invalid)]">{error}</p>}
      {result && (
        <div className="mt-4 border border-[var(--valid)] p-4 text-sm">
          <p className="text-[var(--valid)]">Transfer submitted</p>
          <p className="mt-2 text-[var(--ink-soft)]">{result.notice}</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {result.txids.map((txid) => (
              <li key={txid}>
                <a
                  href={`https://mempool.space/tx/${txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)]"
                >
                  {txid.slice(0, 16)}…
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="btn-row mt-8">
        {!account ? (
          <button type="button" className="btn btn-solid" onClick={() => walletOpenRef.current?.()}>
            Connect &amp; bind wallet
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-solid"
            disabled={!canSend || busy}
            onClick={() => setConfirmOpen(true)}
          >
            {busy ? "Working…" : "Review transfer"}
          </button>
        )}
      </div>

      {confirmOpen && account && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="panel-edit modal-sheet mb-[env(safe-area-inset-bottom)] w-full sm:mb-0 sm:max-w-lg">
            <p className="kicker">Confirm</p>
            <h3 className="font-display mt-2 text-2xl">Send SATDUST</h3>
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Send <strong className="text-[var(--ink)]">{qty} SATDUST</strong> to{" "}
              <span className="font-mono text-xs">{recipient.trim()}</span>. Your wallet will ask you
              to approve spending the inscription UTXO(s). Network fees are paid in BTC.
            </p>
            <div className="btn-row mt-6">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-solid" onClick={() => void onConfirm()}>
                Confirm in wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--ink)]/20 p-3">
      <p className="byline">{label}</p>
      <p className="font-display mt-1 text-lg">{value}</p>
    </div>
  );
}
