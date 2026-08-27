# Scan testing

The payload format is only useful where apps actually parse it, and no published
spec exists to appeal to. This table is the project's source of truth. Add a row
result whenever you test an app.

Generate codes to test with:

```sh
node examples/generate.js <IBAN> 100 2500.50
```

Then scan `qr-out/*.png` from each app's own scanner and record what happened.
Test more than one amount — an app that handles `100` can still trip on
`2500.50`.

## What counts as each result

- **works** — transfer screen opens with the account *and* the amount filled in.
- **partial** — account resolves but the amount does not carry. Note it; the
  shopper still has to type the amount, which is most of the pain we set out
  to remove.
- **fails** — app does not recognise the code. Record the exact error text.

## Banks

The untested rows are the banks and wallets sendkardo.com advertises as
supported. That is their marketing claim, not our evidence — treat every row as
unverified until someone here scans it.

| App | Version | Date tested | Result | Notes |
| --- | --- | --- | --- | --- |
| UBL Digital | | 2026-08-27 | **works** | Account and amount both prefilled |
| HBL | | | untested | Competitor headlines this one specifically |
| Meezan | | | untested | |
| MCB | | | untested | |
| Allied (myABL) | | | untested | |
| Bank Alfalah | | | untested | |
| Bank Al Habib | | | untested | |
| Askari | | | untested | |
| Faysal | | | untested | |
| NBP | | | untested | |
| Standard Chartered | | | untested | |

## Wallets

| App | Version | Date tested | Result | Notes |
| --- | --- | --- | --- | --- |
| Easypaisa | | | untested | |
| JazzCash | | | untested | |
| NayaPay | | | untested | |
| SadaPay | | | untested | |
| Zindigi | | | untested | |
| HBL Konnect | | | untested | |
| UPaisa | | | untested | |
| Alfa | | | untested | |

## Why this matters commercially

A merchant whose customers bank with an app in the **fails** column will get
support messages and lost orders, and will blame us. Knowing the real coverage
decides whether the checkout shows the QR alone or always pairs it with the
account number as a fallback.

Until this table is filled in, the React component and the Shopify extension
both show the IBAN as copyable text next to the code. Do not remove that
fallback on the strength of a competitor's marketing page.
