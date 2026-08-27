# QRPayments

Generate Pakistani bank-transfer payment QR codes from an IBAN and an amount.

Shoppers scan the code with their existing banking app and the account and amount
are filled in for them, instead of copying a 24-character IBAN by hand.

The core library has no dependencies and makes no network calls.

## Usage

```js
import { buildPayload } from "@qrpayments/raast-qr";

buildPayload({ iban: "PK51UNIL0109000262456845", amount: "2500.00" });
// "0002020102120202000424PK51UNIL010900026245684505072500.0007122808202623591004B47F"
```

Render it with any QR library:

```js
import QRCode from "qrcode";
const svg = await QRCode.toString(payload, { type: "svg", errorCorrectionLevel: "H" });
```

## API

| Function | Purpose |
| --- | --- |
| `buildPayload({ iban, amount?, expiry?, now? })` | Build a payment payload. Omit `amount` for a static "any amount" code. |
| `parsePayload(payload)` | Read a payload back, verifying its checksum. |
| `isValidIban(value)` | Structure and ISO 7064 MOD-97 check. |
| `normalizeAmount(value)` | Payload-ready amount, or `null` if unusable. |
| `defaultExpiry(now?)` | End of the following day. |

Bad input throws `PayloadError` with a `code`: `INVALID_IBAN`, `INVALID_AMOUNT`,
`INVALID_EXPIRY`, `BAD_CRC`, `MISSING_CRC`, `INVALID_PAYLOAD`.

Pass money as a string (`"0.30"`). `0.1 + 0.2` produces `0.30000000000000004`,
which is rejected for having more than two decimal places.

## Payload format

A flat run of Tag-Length-Value fields — 2-digit tag, 2-digit length, then that
many characters, no separators.

| Tag | Meaning |
| --- | --- |
| `00` | Format version (`02`) |
| `01` | `11` static, `12` dynamic |
| `02` | Reserved (`00`) |
| `04` | IBAN |
| `05` | Amount |
| `07` | Expiry, `DDMMYYYYHHmm` |
| `10` | CRC-16/CCITT-FALSE, 4 hex chars, covering everything before it |

The layout lives in `TAG` in [src/payload.js](src/payload.js).

Expiry is only a field in the payload — enforcing it is up to the scanning app,
and some ignore it. Do not treat it as a security control.

## Generating test codes

```sh
node examples/generate.js PK51UNIL0109000262456845 100 2500.50
```

Writes one PNG per amount into `qr-out/`, named `<bank>-<last4>-<amount>.png`.
Omit the amounts for a static "any amount" code. The folder is gitignored, so
test codes never reach the repo.

Scan what it produces, then record the outcome in
[docs/scan-testing.md](docs/scan-testing.md).

## QR image service

Shopify checkout UI extensions cannot draw a QR code themselves, so they point an
`<Image>` at this service.

```sh
node server/index.js          # PORT defaults to 3000
```

| Route | Returns |
| --- | --- |
| `GET /qr.png?iban=&amount=&expiry=&width=` | PNG, cached immutably |
| `GET /qr.svg?...` | SVG, same parameters |
| `GET /healthz` | `{"ok":true}` |

Bad input returns 400 with `{ error, code }`.

## Tests

```sh
npm test
```

## Status

Verified scanning against UBL. Other banks and wallets still need testing —
see [docs/scan-testing.md](docs/scan-testing.md).

## License

MIT
