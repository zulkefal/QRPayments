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
