# Mint runbook (summary)

1. Confirm SATDUST ticker free on authoritative DUST-20 index
2. Deploy payload with max_sats = 54600 × 546 = 29811600
3. Wait for indexer acceptance
4. OPEN MINT on site (`DEPLOY_TXID` set)
5. Quotes: median BTC/USD, 60s TTL, HMAC signature
6. Reveal: output0=546 carrier@offset0, output1=project fee

Project address (hard-coded):

`bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4`
