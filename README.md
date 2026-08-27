# QRPayments

Bank-transfer checkout for Pakistani online stores. A shopper scans a QR with
their existing banking app instead of copying a 24-character IBAN by hand.

## Layout

```
packages/core        payload library, React components, QR rendering
apps/qr-service      HTTP service rendering QR images
```

| Workspace | Package | What it is |
| --- | --- | --- |
| `packages/core` | `@qrpayments/raast-qr` | The payload format, `<PaymentQR>` for React, PNG/SVG rendering. Public and MIT. |
| `apps/qr-service` | `@qrpayments/qr-service` | Serves QR images to checkout surfaces that cannot draw one themselves. |

The core is deliberately open — a free competitor already gives the same
generation away, so there is nothing to gain by hiding it. It is the on-ramp.
Order tracking and reconciliation are the product.

## Getting started

```sh
npm install          # links workspaces
npm test             # runs every workspace's tests
```

Generate codes to scan:

```sh
npm run qr -- PK51UNIL0109000262456845 100 2500.50
```

PNGs land in `qr-out/` (gitignored). Record what each bank app does with them
in [docs/scan-testing.md](docs/scan-testing.md).

Run the image service:

```sh
npm run qr-service   # PORT defaults to 3000
```

## Deployment

The Shopify app ships as a container built from the repository root. See
[docs/deployment.md](docs/deployment.md) for environment variables, the health
check, and hosting notes.

## Status

The payload format has no published specification and was verified empirically.
It scans correctly in **UBL Digital**. Every other bank and wallet is still
unverified — see [docs/scan-testing.md](docs/scan-testing.md), which is the
most important file in this repo.

## License

MIT
