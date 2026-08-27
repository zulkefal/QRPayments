# Scan testing

The payload format is only useful where apps actually parse it. This table is
the project's source of truth on that. Add a row whenever you test an app.

Generate a code to test with:

```sh
node examples/generate.js PK51UNIL0109000262456845 100
```

Then scan `qr.png` from the app's own scanner and record what happened.

| App | Version | Date tested | Result | Notes |
| --- | --- | --- | --- | --- |
| UBL Digital | | 2026-08-27 | works | Account and amount both prefilled |
| Meezan | | | untested | |
| HBL | | | untested | |
| Bank Alfalah | | | untested | |
| JazzCash | | | untested | |
| Easypaisa | | | untested | |
| SadaPay | | | untested | |
| NayaPay | | | untested | |
| Allied (myABL) | | | untested | |
| Standard Chartered | | | untested | |

## What counts as each result

- **works** — transfer screen opens with the account *and* the amount filled in.
- **partial** — account resolves but the amount does not carry; note it, the
  shopper still has to type the amount.
- **fails** — app does not recognise the code. Record the exact error text.
