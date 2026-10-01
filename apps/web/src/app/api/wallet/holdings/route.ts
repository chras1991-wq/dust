import { listMints } from "@/lib/store";
import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

const TRANSFERABLE = new Set([
  "PSBT_CREATED",
  "COMMIT_SIGNED",
  "COMMIT_BROADCAST",
  "COMMIT_CONFIRMED",
  "REVEAL_CREATED",
  "REVEAL_SIGNED",
  "REVEAL_BROADCAST",
  "REVEAL_MEMPOOL",
  "REVEAL_CONFIRMED",
  "INDEXER_PENDING",
  "DUST_VALID",
]);

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "wallet-holdings", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  if (!isValidBech32(address)) {
    return noStoreJson({ error: "Invalid address" }, { status: 400 });
  }

  const mints = listMints().filter((m) => m.walletAddress === address && TRANSFERABLE.has(m.status));
  const lots = mints
    .filter((m) => m.inscriptionId || m.revealTxid)
    .map((m) => ({
      mintId: m.id,
      amount: m.amount,
      inscriptionId: m.inscriptionId ?? null,
      revealTxid: m.revealTxid ?? null,
      carrierSats: m.carrierSats,
      status: m.status,
    }));

  const balance = lots.reduce((s, l) => s + l.amount, 0);

  return noStoreJson({
    address: `${address.slice(0, 6)}…${address.slice(-4)}`,
    balance,
    lots,
  });
}
