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
    // shoppers cannot act on this; merchants editing the page can
    return shopify.extension?.editor ? (
      <s-banner heading="Bank transfer" tone="warning">
        Add your bank account in the app to show a payment code here.
      </s-banner>
    ) : null;
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
        {/*
          Account details come before the code. A shopper's bank app shows the
          recipient name on the transfer screen, and if it does not match what
          they expected, they abandon the payment. Let them confirm who they
          are paying first, then scan.
        */}
        <s-stack direction="block" gap="small-500">
          {settings.bankName ? (
            <Field label="Bank name" value={settings.bankName} />
          ) : null}
          <Field label="Account title" value={settings.accountTitle} />

          {/*
            The IBAN is plain text, never inside the clipboard element — that
            element takes no children and swallows anything nested in it. Copy
            is a separate button pointed at it, so a broken copy affordance can
            never hide the number itself.
          */}
          <Field label="IBAN" value={formatIban(settings.iban)} />
          <s-clipboard-item id="qrpay-iban" text={settings.iban} />
          <s-button command="--copy" commandFor="qrpay-iban" variant="secondary">
            Copy IBAN
          </s-button>
        </s-stack>

        {amount ? (
          <s-text type="strong">Rs {amount}</s-text>
        ) : null}

        <s-divider />

        {payload ? (
          <>
            <s-paragraph>
              Scan this with your banking app. The account and amount are filled
              in for you.
            </s-paragraph>
            <s-box inlineSize="100%" maxInlineSize="340px">
              <s-qr-code
                content={payload}
                size="fill"
                border="base"
                accessibilityLabel={
                  amount
                    ? `Payment QR code for Rs ${amount}`
                    : "Payment QR code for this order"
                }
              />
            </s-box>
          </>
        ) : (
          <s-paragraph>
            Transfer this amount to the account above from your banking app.
          </s-paragraph>
        )}
      </s-stack>
    </s-section>
  );
}

/** A labelled detail, so a shopper knows what each value is before paying. */
function Field({ label, value }) {
  return (
    <s-stack direction="inline" gap="small-300">
      <s-text color="subdued">{label}:</s-text>
      <s-text type="strong">{value}</s-text>
    </s-stack>
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
