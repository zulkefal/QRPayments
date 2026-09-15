import "@shopify/ui-extensions/preact";
import { render } from "preact";
import {
  buildPayload,
  formatIban,
  toWholeRupees,
  PayloadError,
} from "@qrpayments/raast-qr";

export default async () => {
  render(<Extension />, document.body);
};

// Payment types where the shopper has already paid electronically — showing
// bank-transfer instructions to them is wrong. Everything else (manualPayment,
// local, paymentOnDelivery, …) is a "pay us directly" method the QR is for.
const PAID_ONLINE = new Set([
  "creditCard",
  "wallet",
  "offsite",
  "customOnsite",
  "redeemable",
]);

/**
 * True only when we can positively see the order was paid online. Unknown or
 * empty (which can happen on the thank-you page) counts as false: hiding
 * payment instructions from a bank-transfer shopper who still owes money is far
 * worse than briefly showing them to a card shopper, so we only hide when sure.
 */
function paidOnline() {
  const selected = shopify.selectedPaymentOptions?.value ?? [];
  const types = selected.map((o) => o?.type).filter(Boolean);
  return types.length > 0 && types.every((t) => PAID_ONLINE.has(t));
}

// Sample details for the editor preview when the merchant has not saved any
// bank account yet, so the block is never a confusing blank in the customizer
// or during app review.
const SAMPLE = {
  iban: "PK77UNIL0000000012345678",
  accountTitle: "Your business name",
  bankName: "Your bank",
};

function Extension() {
  // In the checkout editor, always render a working preview: the merchant
  // setting up — and a Shopify reviewer examining the extension — must be able
  // to see the block regardless of payment method or whether a real order
  // exists. The payment gate below only governs what live shoppers see.
  const editor = Boolean(shopify.extension?.editor);

  // Live shoppers who already paid online need no bank transfer. In the editor
  // this gate is skipped so the block previews.
  if (!editor && paidOnline()) return null;

  const entries = shopify.appMetafields?.value ?? [];
  const saved = readSettings(entries);

  if (!saved && !editor) return null; // shoppers can do nothing with a blank

  // fall back to sample details in the editor so the preview always renders
  const settings = saved ?? SAMPLE;

  const total = shopify.cost?.totalAmount?.value;

  // the code encodes a Pakistani rupee transfer; showing one against a total
  // in another currency would tell the shopper to send the wrong amount
  const wrongCurrency = total?.currencyCode && total.currencyCode !== "PKR";

  // Whole rupees, rounded down. Bank apps drop the fractional part and UBL
  // errors on it outright, so an order of 2,970.38 is asked for as 2,970 — the
  // shopper sees that same figure below and is never charged above their total.
  let amount =
    !wrongCurrency && typeof total?.amount === "number"
      ? toWholeRupees(total.amount.toFixed(2)) || undefined
      : undefined;
  // the editor has no real order total; show a sample so the amount line and
  // the encoded value are both demonstrable
  if (editor && !amount) amount = "1000";

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
        {editor && !saved ? (
          <s-banner tone="info">
            Preview with sample details. Add your bank account in the app to show
            this to shoppers. In a live store it appears only when a shopper
            chooses to pay by bank transfer.
          </s-banner>
        ) : null}
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
