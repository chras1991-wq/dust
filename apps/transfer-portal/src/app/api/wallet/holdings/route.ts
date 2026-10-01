import { noStoreJson, rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

function isValidBech32(address: string): boolean {
  return /^bc1[a-z0-9]{25,87}$/i.test(address);
}

function indexBase(): string {
  const raw = process.env.INDEX_API_URL?.trim() || "https://dust20.com";
  return raw.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "wallet-holdings", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  if (!isValidBech32(address)) {
    return noStoreJson({ error: "Invalid address" }, { status: 400 });
  }

  const upstream = `${indexBase()}/api/wallet/holdings?address=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(upstream, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return noStoreJson(data);
    }
  } catch {
    /* fall through */
  }

  // Upstream may not expose holdings yet — mirror balance-only shape.
  try {
    const balanceRes = await fetch(
      `${indexBase()}/api/wallet/balance?address=${encodeURIComponent(address)}`,
      { cache: "no-store" }
    );
    const balanceData = await balanceRes.json();
    if (!balanceRes.ok) {
      return noStoreJson({ error: balanceData.error || "Index unavailable" }, { status: 502 });
    }
    return noStoreJson({
      address: balanceData.address,
      balance: balanceData.balance ?? 0,
      lots: [],
    });
  } catch {
    return noStoreJson({ error: "Could not reach SATDUST index" }, { status: 502 });
  }
}
