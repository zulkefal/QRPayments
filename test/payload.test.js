import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPayload, parsePayload, defaultExpiry, PayloadError,
  isValidIban, normalizeAmount, crc16, decodeFields,
} from "../src/index.js";

const IBAN = "PK51UNIL0109000262456845";
const AT = new Date("2026-08-27T12:00:00");

test("crc16 matches the standard check vector", () => {
  assert.equal(crc16("123456789"), "29B1");
});

test("iban validation", () => {
  assert.ok(isValidIban(IBAN));
  assert.ok(isValidIban("pk51 unil 0109 0002 6245 6845"), "forgives case and spaces");
  assert.ok(!isValidIban("PK52UNIL0109000262456845"), "rejects bad check digits");
  assert.ok(!isValidIban("PK51UNIL010900026245684"), "rejects short");
  assert.ok(!isValidIban("GB51UNIL0109000262456845"), "rejects non-PK");
  assert.ok(!isValidIban(null));
});

test("amount normalization", () => {
  assert.equal(normalizeAmount(100), "100");
  assert.equal(normalizeAmount("5,000.50"), "5000.50");
  assert.equal(normalizeAmount("0.01"), "0.01");
  assert.equal(normalizeAmount(undefined), "", "omitted means static QR");
  assert.equal(normalizeAmount(0), null);
  assert.equal(normalizeAmount(-5), null);
  assert.equal(normalizeAmount("4.222"), null, "max two decimals");
  assert.equal(normalizeAmount(0.1 + 0.2), null, "float noise is rejected");
  assert.equal(normalizeAmount("Rs 500"), null);
  assert.equal(normalizeAmount("99999999999"), null, "over 10 chars");
});

test("builds a known-good priced payload", () => {
  assert.equal(
    buildPayload({ iban: IBAN, amount: 100, now: AT }),
    "0002020102120202000424PK51UNIL010900026245684505031000712280820262359100414E2"
  );
});

test("an unpriced payload is static and has no expiry", () => {
  const payload = buildPayload({ iban: IBAN });
  const parsed = parsePayload(payload);
  assert.equal(parsed.isDynamic, false);
  assert.equal(parsed.amount, "");
  assert.equal(parsed.expiry, "");
  assert.equal(parsed.iban, IBAN);
});

test("round trips through the parser", () => {
  const parsed = parsePayload(buildPayload({ iban: IBAN, amount: "2500.75", now: AT }));
  assert.equal(parsed.iban, IBAN);
  assert.equal(parsed.amount, "2500.75");
  assert.equal(parsed.expiry, "2026-08-28T23:59");
  assert.ok(parsed.isDynamic);
});

test("a priced QR defaults to expiring the next day", () => {
  assert.equal(defaultExpiry(new Date("2026-08-27T12:00:00")), "2026-08-28");
  assert.equal(defaultExpiry(new Date("2026-12-31T12:00:00")), "2027-01-01", "crosses year end");
});

test("rejects bad input with a coded error", () => {
  assert.throws(() => buildPayload({ iban: "nope", amount: 1 }), { code: "INVALID_IBAN" });
  assert.throws(() => buildPayload({ iban: IBAN, amount: -1 }), { code: "INVALID_AMOUNT" });
  assert.throws(() => buildPayload({ iban: IBAN, expiry: "2026-02-31" }), { code: "INVALID_EXPIRY" });
  assert.throws(() => buildPayload({}), { code: "INVALID_IBAN" });
});

test("parser catches a tampered payload", () => {
  const payload = buildPayload({ iban: IBAN, amount: 100, now: AT });
  const tampered = payload.replace("0503100", "0503999");
  assert.throws(() => parsePayload(tampered), { code: "BAD_CRC" });
});

test("tlv walker rejects a truncated field", () => {
  assert.throws(() => decodeFields("0024AB"), SyntaxError);
});

test("every field length matches its value", () => {
  for (const f of decodeFields(buildPayload({ iban: IBAN, amount: "1234.56", now: AT }))) {
    assert.equal(f.value.length, f.length, `tag ${f.tag}`);
  }
});

/**
 * Cross-checked against the payloads asserted by sendkardo-qr's own tests
 * (github.com/umr13/sendkardo-qr, MIT). Independent implementation, same wire
 * format — these pin compatibility so a refactor cannot silently drift.
 */
test("reproduces upstream reference vectors", () => {
  const REF = "PK33ABCD0000000000000000";

  assert.equal(
    buildPayload({ iban: REF }),
    "0002020102110202000424PK33ABCD00000000000000001004BA20"
  );
  assert.equal(
    buildPayload({ iban: REF, amount: "500", expiry: "2026-12-31" }),
    "0002020102120202000424PK33ABCD0000000000000000050350007123112202623591004EC99"
  );
  assert.equal(
    buildPayload({ iban: REF, amount: "5,000.50", expiry: "2026-12-31T18:30" }),
    "0002020102120202000424PK33ABCD000000000000000005075000.50071231122026183010041E4C"
  );
});

test("verified-scanning payload stays byte-stable", () => {
  // this exact payload was scanned successfully by UBL Digital on 2026-08-27
  assert.equal(
    buildPayload({ iban: "PK51UNIL0109000262456845", amount: 100, now: new Date("2026-08-27T12:00:00") }),
    "0002020102120202000424PK51UNIL010900026245684505031000712280820262359100414E2"
  );
});
