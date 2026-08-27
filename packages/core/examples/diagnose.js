/**
 * Generate a set of codes that differ in one variable at a time, so a bank app
 * that rejects one and accepts another tells us which field it dislikes.
 *
 *   node examples/diagnose.js <IBAN>
 *
 * Scan every file with the same app and record the outcome in
 * docs/scan-testing.md. The filenames say what each one tests.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import { buildPayload, parsePayload } from "../src/index.js";
import { DEFAULT_STYLE } from "../src/render.js";

const iban = process.argv[2];
if (!iban) {
  console.error("usage: node examples/diagnose.js <IBAN>");
  process.exit(1);
}

const CASES = [
  ["01-integer-small", { amount: "100" }, "known good on UBL earlier"],
  ["02-integer-large", { amount: "2970" }, "same size, no decimals"],
  ["03-decimal-38", { amount: "2970.38" }, "the failing case"],
  ["04-decimal-00", { amount: "2970.00" }, "decimals present but zero"],
  ["05-decimal-small", { amount: "100.50" }, "small value with decimals"],
  ["06-no-amount", {}, "static code, no amount field at all"],
];

const outDir = resolve(import.meta.dirname, "..", "..", "..", "qr-out", "diagnose");
mkdirSync(outDir, { recursive: true });

for (const [name, options, why] of CASES) {
  const payload = buildPayload({ iban, ...options });
  const parsed = parsePayload(payload);
  const file = resolve(outDir, `${name}.png`);

  await QRCode.toFile(file, payload, { ...DEFAULT_STYLE, width: 600 });

  console.log(`${name}.png`);
  console.log(`  tests   ${why}`);
  console.log(`  amount  ${parsed.amount || "(none)"}`);
  console.log(`  payload ${payload}\n`);
}

console.log(`${CASES.length} codes in qr-out/diagnose/`);
console.log("\nScan all six with UBL. The first one that fails names the culprit:");
console.log("  01 works, 03 fails  -> decimals are the problem");
console.log("  01 works, 02 fails  -> the amount value or length is");
console.log("  06 works, others no -> UBL rejects any amount field");
