import "@shopify/ui-extensions/preact";
import { render } from "preact";
import {
  useAppMetafields,
  useTotalAmount,
} from "@shopify/ui-extensions/checkout/preact";
import { buildPayload, formatIban, PayloadError } from "@qrpayments/raast-qr";

export default async function () {
  render(<BankTransferQr />, document.body);
}

function BankTransferQr() {
  const [entry] = useAppMetafields({ namespace: "$app", key: "bank_settings" });
  const total = useTotalAmount();

  // nothing to show until the merchant finishes setup
  const settings = parseSettings(entry?.metafield?.value);
  if (!settings) return null;

  // the code encodes a Pakistani rupee transfer; showing one for a total in
  // another currency would tell the shopper to send the wrong amount
  if (total?.currencyCode && total.currencyCode !== "PKR") return null;

  // Money.amount is a number, so it can carry float noise. Two decimals is
  // both what the payload accepts and what a bank app expects.
  const amount = typeof total?.amount === "number" ? total.amount.toFixed(2) : undefined;

  let payload;
  try {
    payload = buildPayload({ iban: settings.iban, amount });
  } catch (error) {
    if (!(error instanceof PayloadError)) throw error;
    // a wrong code is worse than none — fall back to the account details,
    // which are always payable by hand
    payload = null;
  }

  return (
    <s-section heading="Pay by bank transfer">
      <s-stack direction="block" gap="base">
        <s-paragraph>
          Scan this with your banking app. The account and amount are filled in
          for you.
        </s-paragraph>

        {payload ? (
          <s-qr-code
            content={payload}
            size="base"
            border="base"
            accessibilityLabel={`Payment QR code for ${amount ? `Rs ${amount}` : "this order"}`}
          />
        ) : null}

        {amount ? (
          <s-text type="strong">Rs {amount}</s-text>
        ) : null}

        <s-divider />

        <s-paragraph>
          Or transfer manually{payload ? "" : " — this order cannot be shown as a code"}:
        </s-paragraph>
        <s-stack direction="block" gap="small-500">
          {settings.bankName ? <s-text>{settings.bankName}</s-text> : null}
          <s-text type="strong">{settings.accountTitle}</s-text>
          <s-clipboard-item text={settings.iban}>
            <s-text>{formatIban(settings.iban)}</s-text>
          </s-clipboard-item>
        </s-stack>
      </s-stack>
    </s-section>
  );
}

/** Metafield values arrive as strings; a malformed one must not break the page. */
function parseSettings(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed?.iban ? parsed : null;
  } catch {
    return null;
  }
}
