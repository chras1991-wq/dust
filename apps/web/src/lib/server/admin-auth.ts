import "server-only";
import { getAdminToken } from "@/lib/server/secrets";

export function adminAuthorized(req: Request): boolean {
  const expected = getAdminToken();
  if (!expected) return false;
  const header = req.headers.get("x-admin-token")?.trim();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return header === expected || bearer === expected;
}
