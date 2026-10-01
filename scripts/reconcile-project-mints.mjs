#!/usr/bin/env node
/**
 * One-off: scan PROJECT_ADDRESS txs for UTC day, credit SATDUST from project-fee outputs.
 * Usage: node scripts/reconcile-project-mints.mjs [--date 2026-10-01] [--dry-run]
 */
import { createHmac } from "node:crypto";

const PROJECT = "bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4";
const MINT_USD = 1;
const MEMPOOL = "https://mempool.space/api";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dateArg = args.find((a) => a.startsWith("--date="))?.split("=")[1] || "2026-10-01";

function dayBoundsUtc(isoDate) {
  const start = Math.floor(new Date(`${isoDate}T00:00:00.000Z`).getTime() / 1000);
  return { start, end: start + 86400 };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function fetchBtcUsdMedian() {
  const [cb, kr, bs] = await Promise.all([
    fetchJson("https://api.coinbase.com/v2/prices/BTC-USD/spot").then(
      (d) => Number(d.data.amount)
    ),
    fetchJson("https://api.kraken.com/0/public/Ticker?pair=XBTUSD").then(
      (d) => Number(d.result.XXBTZUSD.c[0])
    ),
    fetchJson("https://www.bitstamp.net/api/v2/ticker/btcusd/").then((d) =>
      Number(d.last)
    ),
  ]);
  const prices = [cb, kr, bs].filter((p) => Number.isFinite(p) && p > 0);
  prices.sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}

function feeSatsToSatdust(feeSats, btcUsd) {
  const usd = (feeSats / 1e8) * btcUsd;
  return Math.max(1, Math.round(usd / MINT_USD));
}

function pickUserAddress(tx) {
  const project = PROJECT.toLowerCase();
  for (const vin of tx.vin || []) {
    const addr = vin.prevout?.scriptpubkey_address;
    if (addr && addr.toLowerCase() !== project) return addr;
  }
  return null;
}

/** User mint payment: pays FROM user UTXO TO project fee output (not project spending itself). */
function isUserMintFeeTx(tx) {
  const project = PROJECT.toLowerCase();
  const hasUserVin = (tx.vin || []).some((vin) => {
    const a = vin.prevout?.scriptpubkey_address;
    return a && a.toLowerCase() !== project;
  });
  if (!hasUserVin) return false;
  const projectOut = (tx.vout || [])
    .filter((o) => o.scriptpubkey_address?.toLowerCase() === project)
    .reduce((s, o) => s + o.value, 0);
  return projectOut > 0;
}

async function listAddressTxids(address) {
  const ids = [];
  let url = `${MEMPOOL}/address/${address}/txs`;
  for (;;) {
    const page = await fetchJson(url);
    if (!Array.isArray(page) || page.length === 0) break;
    for (const t of page) ids.push(t.txid);
    if (page.length < 25) break;
    const last = page[page.length - 1].txid;
    url = `${MEMPOOL}/address/${address}/txs/chain/${last}`;
  }
  return ids;
}

async function main() {
  const { start, end } = dayBoundsUtc(dateArg);
  const btcUsd = await fetchBtcUsdMedian();
  console.error(`Date UTC ${dateArg}, BTC/USD median ${btcUsd}`);

  const txids = await listAddressTxids(PROJECT);
  const byAddress = new Map();

  for (const txid of txids) {
    const summary = await fetchJson(`${MEMPOOL}/tx/${txid}`);
    const bt = summary.status?.block_time;
    if (!bt || bt < start || bt >= end) continue;
    if (!summary.status?.confirmed) continue;
    if (!isUserMintFeeTx(summary)) continue;

    const projectSats = (summary.vout || [])
      .filter((o) => o.scriptpubkey_address === PROJECT)
      .reduce((s, o) => s + o.value, 0);
    if (projectSats <= 0) continue;

    const user = pickUserAddress(summary);
    if (!user) {
      console.error("skip no user", txid);
      continue;
    }

    const units = feeSatsToSatdust(projectSats, btcUsd);
    const prev = byAddress.get(user) || { amount: 0, revealTxids: [], fees: 0 };
    prev.amount += units;
    prev.fees += projectSats;
    prev.revealTxids.push(txid);
    byAddress.set(user, prev);
  }

  const mints = [...byAddress.entries()].map(([address, v]) => ({
    address,
    amount: v.amount,
    revealTxid: v.revealTxids[v.revealTxids.length - 1],
    status: "REVEAL_CONFIRMED",
    mintId: `chain_${address.slice(4, 14)}_${dateArg.replace(/-/g, "")}`,
  }));

  console.error(`Wallets ${mints.length}, total SATDUST ${mints.reduce((s, m) => s + m.amount, 0)}`);
  if (dryRun) {
    console.log(JSON.stringify({ btcUsd, mints }, null, 2));
    return;
  }

  const site = process.env.RESTORE_SITE_URL || "https://dust20.com";
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("Set ADMIN_TOKEN");

  const res = await fetch(`${site}/api/admin/ledger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify({ mints }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));
  console.log(JSON.stringify(body, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
