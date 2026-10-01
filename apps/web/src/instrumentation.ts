export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getStore } = await import("@/lib/store");
  const { ensureStoreHydrated } = await import("@/lib/store-persist");
  await ensureStoreHydrated(getStore());
}
