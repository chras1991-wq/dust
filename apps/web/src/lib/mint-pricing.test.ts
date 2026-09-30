import { describe, expect, it } from "vitest";
import { splitMintPaymentSats } from "./mint-pricing";

describe("splitMintPaymentSats", () => {
  it("treats quote feeSats as all-in payment (carrier inside, not stacked)", () => {
    const qty = 200;
    const quoteTotal = 241_000; // ~$200 at ~83k BTC/USD
    const split = splitMintPaymentSats(qty, quoteTotal);
    expect(split.paySats).toBe(241_000);
    expect(split.carrierSats).toBe(200 * 546);
    expect(split.projectFeeSats).toBe(241_000 - 200 * 546);
    expect(split.unitPaySats).toBe(1205);
  });
});
