import { createElement as h, useMemo, useState, useCallback } from "react";
import { buildPayload, PayloadError } from "./payload.js";
import { normalizeIban } from "./iban.js";
import { toSvgPath } from "./matrix.js";

/** Group an IBAN into fours so a human can read it back to their bank app. */
export function formatIban(iban) {
  return normalizeIban(iban).replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Build the code for a payment, reporting bad input rather than throwing.
 * Nothing here may crash — this renders on a live checkout page, and a store
 * that cannot show a QR should still be able to show its account number.
 *
 * @returns {{path: string|null, extent: number, payload: string|null, error: PayloadError|null}}
 */
export function usePaymentQr({ iban, amount, expiry }) {
  return useMemo(() => {
    try {
      const payload = buildPayload({ iban, amount, expiry });
      return { ...toSvgPath(payload), payload, error: null };
    } catch (error) {
      if (!(error instanceof PayloadError)) throw error;
      return { path: null, extent: 0, payload: null, error };
    }
  }, [iban, amount, expiry]);
}

/**
 * Just the code, no surrounding text. Renders real SVG elements — nothing is
 * injected as an HTML string, so there is no XSS surface.
 *
 * Renders nothing on bad input and reports it through `onError`; a shopper
 * scanning a wrong code is far worse than one who sees no code at all.
 */
export function PaymentQRCode({
  iban, amount, expiry, size = 240, color = "#01411C", title, onError, ...rest
}) {
  const { path, extent, error } = usePaymentQr({ iban, amount, expiry });

  if (error) {
    onError?.(error);
    return null;
  }

  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: `0 0 ${extent} ${extent}`,
      shapeRendering: "crispEdges",
      role: "img",
      "aria-label": title || `Payment QR code${amount ? ` for Rs ${amount}` : ""}`,
      ...rest,
    },
    h("rect", { width: extent, height: extent, fill: "#FFFFFF" }),
    h("path", { d: path, fill: color })
  );
}

/**
 * The full checkout block: code, amount, and the account details in copyable
 * text. The text matters — if a shopper's bank app cannot read the code, they
 * can still pay, and you hear about it in a support message rather than losing
 * the order.
 */
export function PaymentQR({
  iban,
  amount,
  expiry,
  accountTitle,
  bankName,
  size = 240,
  color = "#01411C",
  currency = "Rs",
  className,
  onError,
}) {
  const [copied, setCopied] = useState(false);
  const account = normalizeIban(iban);
  const { path, extent, error } = usePaymentQr({ iban, amount, expiry });

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(account).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false)
    );
  }, [account]);

  if (error) onError?.(error);

  return h(
    "div",
    { className: className || "qrpay" },
    error
      ? h("p", { className: "qrpay__error", role: "alert" }, error.message)
      : h(
          "svg",
          {
            width: size,
            height: size,
            viewBox: `0 0 ${extent} ${extent}`,
            shapeRendering: "crispEdges",
            role: "img",
            "aria-label": `Payment QR code${amount ? ` for ${currency} ${amount}` : ""}`,
          },
          h("rect", { width: extent, height: extent, fill: "#FFFFFF" }),
          h("path", { d: path, fill: color })
        ),
    amount ? h("p", { className: "qrpay__amount" }, `${currency} ${amount}`) : null,
    h(
      "dl",
      { className: "qrpay__details" },
      bankName ? h("dt", null, "Bank") : null,
      bankName ? h("dd", null, bankName) : null,
      accountTitle ? h("dt", null, "Account title") : null,
      accountTitle ? h("dd", null, accountTitle) : null,
      h("dt", null, "IBAN"),
      h("dd", { className: "qrpay__iban" }, formatIban(account))
    ),
    h(
      "button",
      { type: "button", onClick: copy, className: "qrpay__copy" },
      copied ? "Copied" : "Copy IBAN"
    )
  );
}
