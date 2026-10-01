import { describe, expect, it } from "vitest";
import { usdToFeeSats } from "@satdust/quote";
import { creditQtyForPayment, projectPaymentsFromTxs } from "./chain-credit";

const WALLET = "bc1pedny4fgcsqlghqtmexd57sxc0ff2sw8jssq32zf5g2zcy9kuzryqc9z85a";
const PROJECT =
  "bc1qtestprojectaddress000000000000000000000000000";

describe("creditQtyForPayment", () => {
  const unit = usdToFeeSats(1, 83715.4);

  it("credits the two paid mints at the price when they confirmed", () => {
    expect(unit).toBe(1195);
    expect(creditQtyForPayment(92_424, unit)).toBe(77);
    expect(creditQtyForPayment(1_194, unit)).toBe(1);
  });

  it("ignores dust and round amounts that are not a $1 quote", () => {
    expect(creditQtyForPayment(700, unit)).toBe(0);
    expect(creditQtyForPayment(10_000, unit)).toBe(0);
    expect(creditQtyForPayment(0, unit)).toBe(0);
  });
});

describe("projectPaymentsFromTxs", () => {
  it("keeps spends to the project address and drops funds the wallet only received", () => {
    const payments = projectPaymentsFromTxs({
      address: WALLET,
      projectAddress: PROJECT,
      nowSec: 1_790_763_200,
      txs: [
        {
          txid: "adf3415d8333240fdfd2802e4984feef70e9d5816771ab1a28dde342e3864531",
          status: { confirmed: true, block_time: 1_790_763_138 },
          vin: [{ prevout: { scriptpubkey_address: WALLET, value: 93_599 } }],
          vout: [{ scriptpubkey_address: PROJECT, value: 92_424 }],
        },
        {
          txid: "d7a1d2737cef369cdef8a3a8a4fb86c9c8ddc5f6f1185856534a70c19f4f5437",
          status: { confirmed: true, block_time: 1_790_763_138 },
          vin: [{ prevout: { scriptpubkey_address: WALLET, value: 67_500 } }],
          vout: [
            { scriptpubkey_address: PROJECT, value: 1_194 },
            { scriptpubkey_address: WALLET, value: 65_844 },
          ],
        },
        {
          txid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          status: { confirmed: true, block_time: 1_789_829_085 },
          vin: [{ prevout: { scriptpubkey_address: WALLET, value: 20_000 } }],
          vout: [{ scriptpubkey_address: PROJECT, value: 10_000 }],
        },
        {
          txid: "96ac2c2dca4b88e55b942e9c8d7f92f46d112cc6bf71ccb40986c0bc8ca15330",
          status: { confirmed: true, block_time: 1_789_840_144 },
          vin: [{ prevout: { scriptpubkey_address: PROJECT, value: 200_821 } }],
          vout: [
            { scriptpubkey_address: WALLET, value: 100_000 },
            { scriptpubkey_address: PROJECT, value: 100_667 },
          ],
        },
      ],
    });

    expect(payments.map((p) => p.paidSats)).toEqual([92_424, 1_194]);
  });
});
