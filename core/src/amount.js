const AMOUNT = /^\d+(?:\.\d{1,2})?$/;
const MAX_LENGTH = 10;

/**
 * Normalize an amount for the payload, or return null if it cannot be
 * represented. Commas are stripped; everything else must already be clean.
 *
 * Pass money as a string ("0.30") rather than arithmetic — 0.1 + 0.2 gives
 * 0.30000000000000004, which is correctly rejected here.
 */
export function normalizeAmount(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" && typeof value !== "number") return null;

  const raw = String(value).trim().replace(/,/g, "");
  if (!raw) return "";
  if (!AMOUNT.test(raw)) return null;
  if (Number(raw) <= 0) return null;

  const trimmed = raw.replace(/^0+(?=\d)/, "");
  return trimmed.length <= MAX_LENGTH ? trimmed : null;
}

/**
 * Round an amount down to whole rupees for the payload.
 *
 * Bank apps do not handle the fractional part: some drop it silently, and UBL
 * errors outright on a decimal amount (observed 2026-08-27). Encoding decimals
 * therefore either understates what a shopper pays or breaks the code.
 *
 * Rounding down, never up: a shopper is never asked for more than their order
 * total. The merchant gives up at most 0.99 per order, which is worth far less
 * than a customer disputing a charge that exceeded what they agreed to pay.
 *
 * Show the returned value to the shopper as the amount due. The figure in the
 * code and the figure on the page must agree.
 *
 * @returns {string|null} whole rupees, "" when no amount was given, or null
 * when the input is unusable — including a total under one rupee, which cannot
 * be represented without rounding it to nothing.
 */
export function toWholeRupees(value) {
  const normalized = normalizeAmount(value);
  if (normalized === null || normalized === "") return normalized;

  const whole = Math.floor(Number(normalized));
  return whole >= 1 ? String(whole) : null;
}
