import "server-only";
import { isProductionRuntime } from "@/lib/server/secrets";

/** Never leak stack traces or internal paths to clients in production. */
export function publicErrorMessage(err: unknown, fallback = "Request failed"): string {
  if (!isProductionRuntime()) {
    return err instanceof Error ? err.message : fallback;
  }
  if (err instanceof Error) {
    const msg = err.message;
    // Allow intentional ABORT / validation messages; strip stacks & paths.
    if (msg.startsWith("ABORT:") || msg.includes("expired") || msg.includes("Invalid")) {
      return msg.length > 180 ? fallback : msg;
    }
  }
  return fallback;
}
