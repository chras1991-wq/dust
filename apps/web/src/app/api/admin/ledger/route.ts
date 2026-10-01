import { getStore } from "@/lib/store";
import { ensureStoreHydrated, importLedgerRows } from "@/lib/store-persist";
import { parseLedgerImportRows } from "@/lib/ledger-bootstrap";
import { adminAuthorized } from "@/lib/server/admin-auth";
import { noStoreJson, rateLimit, readJsonBody } from "@/lib/server/guard";
import { publicErrorMessage } from "@/lib/server/safe-error";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!adminAuthorized(req)) {
    return noStoreJson({ error: "Not found" }, { status: 404 });
  }
  const limited = rateLimit(req, "admin-ledger", 30, 60_000);
  if (limited) return limited;

  await ensureStoreHydrated(getStore());
  const store = getStore();
  return noStoreJson({
    mintRecords: store.mints.length,
    confirmedMinted: store.confirmedMinted,
    pendingMinted: store.pendingMinted,
    kvConfigured: Boolean(process.env.KV_REST_API_URL || process.env.KV_URL),
  });
}

export async function POST(req: Request) {
  if (!adminAuthorized(req)) {
    return noStoreJson({ error: "Not found" }, { status: 404 });
  }
  const limited = rateLimit(req, "admin-ledger-import", 10, 60_000);
  if (limited) return limited;

  try {
    const parsed = await readJsonBody<{ mints?: unknown }>(req);
    if (!parsed.ok) return parsed.response;

    const rows = parseLedgerImportRows(parsed.body.mints);
    if (!rows.length) {
      return noStoreJson({ error: "No valid mint rows" }, { status: 400 });
    }

    const store = getStore();
    await ensureStoreHydrated(store);
    const result = await importLedgerRows(store, rows);

    return noStoreJson({
      ok: true,
      importedRows: rows.length,
      newRecords: result.merged,
      totalMintRecords: result.totalMints,
    });
  } catch (e) {
    return noStoreJson(
      { error: publicErrorMessage(e, "Ledger import failed") },
      { status: 400 }
    );
  }
}
