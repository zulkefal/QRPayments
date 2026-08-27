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
| UBL Digital | | 2026-08-27 | **mixed** | Works to a **UBL** account. Errors to a **NayaPay** account — cross-bank routing, not the payload |
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
| Easypaisa | | 2026-08-27 | **works** | IBAN and amount both read |
| JazzCash | | 2026-08-27 | **works** | IBAN and amount both read |
| NayaPay | | 2026-08-27 | **partial** | Reads IBAN, does not carry the amount — shopper types it |
| SadaPay | | | untested | |
| Zindigi | | | untested | |
| HBL Konnect | | | untested | |
| UPaisa | | | untested | |
| Alfa | | | untested | |

## Always record the destination bank, not just the scanning app

The first UBL result looked like a payload regression: a code with amount `100`
worked, one with `2970.38` errored. The real difference was the destination —
the working code paid a UBL account, the failing one a NayaPay account.

**A result is the pair (scanning app, destination bank).** One app may reach
some banks and not others, and a same-bank success says nothing about
cross-bank. Record both or the table misleads.

## Decimals are dropped

Observed 2026-08-27: an amount of `2970.38` reaches the bank app as `2970`. The
fractional part does not survive.

This is not cosmetic. A Shopify total of Rs 2,970.38 gets paid as Rs 2,970, so
the merchant is short and the payment no longer equals the order total — which
is exactly the match an automatic reconciliation would rely on.

**Settled 2026-08-27: amounts are whole rupees, rounded down.**

`toWholeRupees` floors the total, so an order of Rs 2,970.38 asks for Rs 2,970.
A shopper is never asked for more than they agreed to pay; the merchant gives up
at most 0.99 per order, which is worth far less than a customer disputing a
charge above their order total.

The figure shown to the shopper is the same rounded figure encoded in the code —
those must never disagree.

A total below one rupee cannot be carried at all, since flooring it asks for
nothing. No code is shown and the shopper pays against the account details.

## Open question: the amount field

NayaPay reads the IBAN but drops the amount entirely, while Easypaisa and
JazzCash carry it.

`examples/diagnose.js` generates six codes differing one variable at a time:

```sh
node packages/core/examples/diagnose.js <IBAN>
```

Scan all six with **one app against one destination account**. The first that
fails names the field.

## Why this matters commercially

A merchant whose customers bank with an app in the **fails** column will get
support messages and lost orders, and will blame us. Knowing the real coverage
decides whether the checkout shows the QR alone or always pairs it with the
account number as a fallback.

Until this table is filled in, the React component and the Shopify extension
both show the IBAN as copyable text next to the code. Do not remove that
fallback on the strength of a competitor's marketing page.
