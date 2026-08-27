import "@shopify/ui-extensions/preact";
import { render } from "preact";
import {
  useAppMetafields,
  useExtensionEditor,
  useTotalAmount,
} from "@shopify/ui-extensions/checkout/preact";
import { buildPayload, formatIban, PayloadError } from "@qrpayments/raast-qr";

export default async function () {
  render(<BankTransferQr />, document.body);
}

function BankTransferQr() {
  const [entry] = useAppMetafields({ namespace: "$app", key: "bank_settings" });
  const total = useTotalAmount();
  // shoppers should never see why a code is missing; merchants must
  const editor = useExtensionEditor();

  const settings = parseSettings(entry?.metafield?.value);
  if (!settings) {
    return editor ? (
      <Explain>
        Add your bank account in the app to show a payment code here. Shoppers
        see nothing until you do.
      </Explain>
    ) : null;
  }

  // the code encodes a Pakistani rupee transfer; showing one for a total in
  // another currency would tell the shopper to send the wrong amount
  const currency = total?.currencyCode;
  if (currency && currency !== "PKR") {
    return editor ? (
      <Explain>
        This store prices in {currency}. A bank transfer code can only be shown
        for orders in PKR.
      </Explain>
    ) : null;
  }

  // Money.amount is a number, so it can carry float noise. Two decimals is
  // both what the payload accepts and what a bank app expects.
  const amount =
    typeof total?.amount === "number" ? total.amount.toFixed(2) : undefined;

  let payload = null;
  let failure = null;
  try {
    payload = buildPayload({ iban: settings.iban, amount });
  } catch (error) {
    if (!(error instanceof PayloadError)) throw error;
    // a wrong code is worse than none — the account details below are always
    // payable by hand, so fall back to those rather than showing nothing
    failure = error.message;
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
          <>
            {editor ? <Explain>{failure}</Explain> : null}
            <s-paragraph>Transfer this amount to the account below:</s-paragraph>
            {amount ? <s-text type="strong">Rs {amount}</s-text> : null}
          </>
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

/** Shown only inside the checkout editor, never to a shopper. */
function Explain({ children }) {
  return <s-banner tone="warning">{children}</s-banner>;
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
