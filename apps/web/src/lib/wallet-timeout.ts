/** Reject if an injected wallet never opens its confirm UI (common on mobile WebViews). */
export function withWalletTimeout<T>(
  promise: Promise<T>,
  ms = 120_000,
  message = "Wallet did not respond. Open your wallet extension or app, then try again."
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
