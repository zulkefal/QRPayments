// Compiled under strict mode as a test: if this file typechecks, a Shopify
// React Router app in TypeScript can import the package without friction.
import {
  buildPayload, parsePayload, validateSettings, suggestBank,
  isValidIban, normalizeAmount, PayloadError,
  type MerchantSettings, type ParsedPayload, type SettingsResult,
} from "@qrpayments/raast-qr";
import { renderPng, toSvgPath } from "@qrpayments/raast-qr/render";
import { PaymentQR, formatIban, usePaymentQr } from "@qrpayments/raast-qr/react";
import { createElement } from "react";

const payload: string = buildPayload({ iban: "PK51UNIL0109000262456845", amount: "100" });
const parsed: ParsedPayload = parsePayload(payload);
const amount: string = parsed.amount;
const dynamic: boolean = parsed.isDynamic;

const result: SettingsResult = validateSettings({ iban: "PK51UNIL0109000262456845", accountTitle: "Quecko" });
const settings: MerchantSettings = result.settings;
const ibanError: string | undefined = result.errors.iban;

const valid: boolean = isValidIban(settings.iban);
const normalized: string | null = normalizeAmount("2,500.50");
const bank: string = suggestBank("UNIL").name;
const { path, extent } = toSvgPath(payload);

async function image(): Promise<Buffer> {
  return renderPng({ iban: settings.iban, amount: "100", style: { width: 400 } });
}

function handle(error: PayloadError): string {
  return error.code === "INVALID_IBAN" ? "bad iban" : error.message;
}

// component usage, as a merchant's checkout would write it
const block = createElement(PaymentQR, {
  iban: settings.iban,
  amount: "2500.00",
  accountTitle: settings.accountTitle,
  bankName: settings.bankName,
  onError: (e) => handle(e),
});

const grouped: string = formatIban(settings.iban);

export { payload, amount, dynamic, valid, normalized, bank, path, extent, image, block, grouped, ibanError };
