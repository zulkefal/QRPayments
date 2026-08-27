import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { buildPayload, formatIban, PayloadError } from "@qrpayments/raast-qr";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const entries = shopify.appMetafields?.value ?? [];
  const settings = readSettings(entries);

  if (!settings) {
    // visible on purpose while we confirm shop metafields reach the extension
    return (
      <s-banner heading="Bank transfer" tone="warning">
        Bank details are not set up yet. ({entries.length} metafields visible)
      </s-banner>
    );
  }

  const total = shopify.cost?.totalAmount?.value;

  // the code encodes a Pakistani rupee transfer; showing one against a total
  // in another currency would tell the shopper to send the wrong amount
  const wrongCurrency = total?.currencyCode && total.currencyCode !== "PKR";

  // Money.amount is a number, so it can carry float noise. Two decimals is
  // both what the payload accepts and what a bank app expects.
  const amount =
    !wrongCurrency && typeof total?.amount === "number"
      ? total.amount.toFixed(2)
      : undefined;

  let payload = null;
  try {
    payload = buildPayload({ iban: settings.iban, amount });
  } catch (error) {
    // a wrong code is worse than none — the account details below are always
    // payable by hand, so fall back to those rather than showing nothing
    if (!(error instanceof PayloadError)) throw error;
  }

  return (
    <s-section heading="Pay by bank transfer">
      <s-stack direction="block" gap="base">
        {payload ? (
          <>
            <s-paragraph>
              Scan this with your banking app. The account and amount are filled
              in for you.
            </s-paragraph>
            <s-qr-code
              content={payload}
              size="base"
              border="base"
              accessibilityLabel={
                amount
                  ? `Payment QR code for Rs ${amount}`
                  : "Payment QR code for this order"
              }
            />
            {amount ? <s-text type="strong">Rs {amount}</s-text> : null}
            <s-divider />
            <s-paragraph>Or transfer manually:</s-paragraph>
          </>
        ) : (
          <s-paragraph>Transfer this amount to the account below:</s-paragraph>
        )}

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
function readSettings(entries) {
  const entry = entries.find(
    (e) => e.metafield?.key === "bank_settings" && e.metafield?.value
  );
  if (!entry) return null;

  try {
    const parsed = JSON.parse(entry.metafield.value);
    return parsed?.iban ? parsed : null;
  } catch {
    return null;
  }
}
