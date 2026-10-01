/** Mint issuance ended; index/swap is the live desk. Override with MINT_CLOSED=false for staging. */
export function isMintClosed(): boolean {
  return process.env.MINT_CLOSED !== "false";
}
