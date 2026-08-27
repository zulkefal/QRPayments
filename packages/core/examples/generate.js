/**
 * Generate test QR codes into qr-out/ for scan testing.
 *
 *   node examples/generate.js <IBAN> [amount ...]
 *
 * Pass several amounts to get one code each — handy when checking whether a
 * bank app handles round numbers, decimals and large values the same way.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import { buildPayload, parsePayload, bankCode, normalizeIban } from "../src/index.js";
import { DEFAULT_STYLE } from "../src/render.js";

const [iban, ...amounts] = process.argv.slice(2);

if (!iban) {
  console.error("usage: node examples/generate.js <IBAN> [amount ...]");
  console.error("  e.g. node examples/generate.js PK51UNIL0109000262456845 100 2500.50");
  process.exit(1);
}

const outDir = resolve(import.meta.dirname, "..", "..", "..", "qr-out");
mkdirSync(outDir, { recursive: true });

// no amount given still deserves a code — that is the static "any amount" case
const requested = amounts.length ? amounts : [undefined];

for (const amount of requested) {
  const payload = buildPayload({ iban, amount });
  const parsed = parsePayload(payload);

  // last four digits are enough to tell accounts apart without writing the
  // whole IBAN into a filename
  const account = normalizeIban(iban);
  const label = amount ? String(amount).replace(/[^\d.]/g, "") : "any";
  const name = `${bankCode(account)}-${account.slice(-4)}-${label}.png`;
  const file = resolve(outDir, name);

  const png = await QRCode.toBuffer(payload, { ...DEFAULT_STYLE, type: "png" });
  writeFileSync(file, png);

  console.log(`${name}`);
  console.log(`  amount  ${parsed.amount || "(any)"}`);
  console.log(`  expiry  ${parsed.expiry || "(none)"}`);
  console.log(`  payload ${payload}`);
  console.log(`  file    ${file}\n`);
}

console.log(`Scan these, then record the result in docs/scan-testing.md`);
