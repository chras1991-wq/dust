import { describe, expect, it } from "vitest";
import {
  aggregateBtcUsd,
  createSignedQuote,
  isQuoteExpired,
  usdToFeeSats,
  verifyQuoteSignature,
} from "./index";

describe("quote math", () => {
  it("converts $1 at $100000 BTC to 1000 sats", () => {
    expect(usdToFeeSats(1, 100_000)).toBe(1000);
  });

  it("uses median of provider prices", () => {
    expect(aggregateBtcUsd([100_020, 99_990, 100_010])).toBe(100_010);
  });
});

describe("signed quote", () => {
  it("signs and verifies", () => {
    const q = createSignedQuote({
      btcUsd: 100_000,
      providerPrices: [{ provider: "test", price: 100_000, timestamp: 1 }],
      secret: "test-secret",
      now: 1_700_000_000,
    });
    expect(verifyQuoteSignature(q, "test-secret")).toBe(true);
    expect(verifyQuoteSignature(q, "wrong")).toBe(false);
    expect(isQuoteExpired(q, 1_700_000_000 + 59)).toBe(false);
    expect(isQuoteExpired(q, 1_700_000_000 + 60)).toBe(true);
  });

  it("detects tampered feeSats", () => {
    const q = createSignedQuote({
      btcUsd: 100_000,
      providerPrices: [{ provider: "test", price: 100_000, timestamp: 1 }],
      secret: "test-secret",
    });
    const tampered = { ...q, feeSats: "1" };
    expect(verifyQuoteSignature(tampered, "test-secret")).toBe(false);
  });
});
