import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import { buildPayload, parsePayload, isValidIban } from "/Users/macbookpro/Desktop/QRPayments/packages/core/src/index.js";
import { DEFAULT_STYLE } from "/Users/macbookpro/Desktop/QRPayments/packages/core/src/render.js";

const BANKS = [
  ["UBL", "PK51UNIL0109000262456845"],
  ["NayaPay", "PK91NAYA1234503121599489"],
  ["Meezan", "PK20MEZN0052010110891298"],
  ["SadaPay", "PK55SADA0000003121599489"],
  ["Easypaisa", "PK72TMFB0000000041722330"],
  ["DubaiIslamic", "PK82DUIB0000000622632001"],
  ["AlHabib", "PK02BAHL5012008100693201"],
  ["Allied-2", "PK87ABPA0010055046820012"],
  ["Faysal", "PK47FAYS3059787000005183"],
  ["Alfalah", "PK50ALFH0153001008938530"],
  ["HBL", "PK27HABB0001287903038101"],
  ["Askari", "PK10ASCM0000231650500115"],
  ["Allied", "PK11ABPA0010006490890016"],
  ["JSBank", "PK24JSBL9232000001810660"],
  ["MCBIslamic", "PK09MCIB0021000189640001"],
  ["NBP", "PK92NBPA1531003008607437"],
  ["MCB", "PK52MUCB0736876331001823"],
  ["HabibMetro", "PK43MPBL9904177140407706"],
];

const outDir = "/Users/macbookpro/Desktop/QRPayments/qr-out/banks";
mkdirSync(outDir, { recursive: true });

const rows = [];
for (const [name, iban] of BANKS) {
  if (!isValidIban(iban)) throw new Error(`invalid IBAN for ${name}`);

  for (const [label, amount] of [["100", "100"], ["2970", "2970"]]) {
    const payload = buildPayload({ iban, amount });
    const file = resolve(outDir, `${name}-${label}-${amount}.png`);
    await QRCode.toFile(file, payload, { ...DEFAULT_STYLE, width: 600 });
    rows.push({ name, label, amount, encoded: parsePayload(payload).amount, file });
  }
}

const index = [
  "# Bank scan test set",
  "",
  "Two codes per bank, both whole rupees. Decimals are not used: bank apps drop",
  "the fractional part and UBL errors on it, so amounts round up to whole rupees.",
  "",
  "| Bank | Rs 100 | Rs 2,970 |",
  "| --- | --- | --- |",
  ...BANKS.map(([n]) => `| ${n} | \`${n}-100-100.png\` | \`${n}-2970-2970.png\` |`),
  "",
  "What to record for each: the amount the app displays, or the error text.",
  "A result is the pair (scanning app, destination bank) — note both.",
].join("\n");

writeFileSync(resolve(outDir, "INDEX.md"), index + "\n");
console.log(`${rows.length} codes written to qr-out/banks/`);
console.log(`banks: ${BANKS.length} × 2 variants`);
