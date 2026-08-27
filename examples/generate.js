// node examples/generate.js <IBAN> [amount]
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";
import { buildPayload, parsePayload } from "../src/index.js";

const [iban, amount] = process.argv.slice(2);
if (!iban) {
  console.error("usage: node examples/generate.js <IBAN> [amount]");
  process.exit(1);
}

const payload = buildPayload({ iban, amount });
const parsed = parsePayload(payload);

console.log("payload:", payload);
console.log("iban   :", parsed.iban);
console.log("amount :", parsed.amount || "(any)");
console.log("expiry :", parsed.expiry || "(none)");

await QRCode.toFile("qr.png", payload, { width: 600, errorCorrectionLevel: "H" });
console.log("\nwrote qr.png");
