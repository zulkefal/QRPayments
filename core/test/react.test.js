import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentQR, PaymentQRCode, formatIban } from "../src/react.js";

const IBAN = "PK77UNIL0000000012345678";
const render = (component, props) => renderToStaticMarkup(h(component, props));

test("formats an IBAN into readable groups", () => {
  assert.equal(formatIban(IBAN), "PK77 UNIL 0000 0000 1234 5678");
  assert.equal(formatIban("pk77unil0000000012345678"), "PK77 UNIL 0000 0000 1234 5678");
});

test("renders real svg elements, not injected html", () => {
  const html = render(PaymentQRCode, { iban: IBAN, amount: "100" });
  assert.match(html, /^<svg /);
  assert.match(html, /viewBox="0 0 \d+ \d+"/);
  assert.match(html, /<path d="M/);
  assert.ok(!html.includes("dangerously"));
});

test("carries an accessible label", () => {
  assert.match(render(PaymentQRCode, { iban: IBAN, amount: "250" }), /aria-label="Payment QR code for Rs 250"/);
  assert.match(render(PaymentQRCode, { iban: IBAN, title: "Pay Quecko" }), /aria-label="Pay Quecko"/);
});

test("shows the account details as a fallback for apps that cannot scan", () => {
  const html = render(PaymentQR, { iban: IBAN, amount: "2500.00", accountTitle: "Quecko Pvt Ltd", bankName: "UBL" });
  assert.ok(html.includes("PK77 UNIL 0000 0000 1234 5678"), "IBAN is readable on screen");
  assert.ok(html.includes("Rs 2500.00"));
  assert.ok(html.includes("Quecko Pvt Ltd"));
  assert.ok(html.includes("Copy IBAN"));
});

test("a bad iban shows a message instead of a scannable wrong code", () => {
  let reported = null;
  const html = render(PaymentQR, { iban: "not-an-iban", amount: "100", onError: (e) => { reported = e; } });
  assert.ok(!html.includes("<svg"), "no code is rendered");
  assert.equal(reported?.code, "INVALID_IBAN", "the store is told why");
});

test("works without an amount", () => {
  const html = render(PaymentQR, { iban: IBAN });
  assert.ok(html.includes("<svg"));
  assert.ok(!html.includes("Rs "));
});
