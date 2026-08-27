import test from "node:test";
import assert from "node:assert/strict";
import { validateSettings, suggestBank, knownBankCodes } from "../src/index.js";

const IBAN = "PK51UNIL0109000262456845";

test("accepts a complete setup", () => {
  const result = validateSettings({ iban: IBAN, accountTitle: "Quecko Pvt Ltd" });
  assert.ok(result.valid);
  assert.equal(result.settings.iban, IBAN);
  assert.equal(result.settings.bankName, "United Bank Limited (UBL)");
});

test("normalizes what the merchant typed", () => {
  const result = validateSettings({
    iban: "  pk51 unil 0109 0002 6245 6845 ",
    accountTitle: "  Quecko Pvt Ltd  ",
  });
  assert.equal(result.settings.iban, IBAN, "spaces and case are forgiven");
  assert.equal(result.settings.accountTitle, "Quecko Pvt Ltd", "title is trimmed");
});

test("explains what is wrong in the merchant's terms", () => {
  assert.match(validateSettings({}).errors.iban, /Enter the IBAN/);
  assert.match(validateSettings({ iban: "GB82WEST12345698765432" }).errors.iban, /Pakistani IBAN/);
  assert.match(validateSettings({ iban: "PK52UNIL0109000262456845" }).errors.iban, /mistyped digit/);
  assert.match(validateSettings({ iban: IBAN }).errors.accountTitle, /account title/i);
});

test("an unknown bank code suggests nothing rather than guessing", () => {
  const suggestion = suggestBank("ZZZZ");
  assert.equal(suggestion.name, "");
  assert.equal(suggestion.confident, false);
});

test("a merchant's own bank name wins over our suggestion", () => {
  const result = validateSettings({ iban: IBAN, accountTitle: "X", bankName: "UBL Islamic" });
  assert.equal(result.settings.bankName, "UBL Islamic");
});

test("every known bank code is four uppercase letters", () => {
  for (const code of knownBankCodes()) {
    assert.match(code, /^[A-Z]{4}$/);
    assert.ok(suggestBank(code).confident);
  }
});
