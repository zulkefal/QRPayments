import { crc16 } from "./crc.js";
import { isValidIban, normalizeIban } from "./iban.js";
import { normalizeAmount } from "./amount.js";
import { decodeFields, encodeField } from "./tlv.js";

/**
 * Field layout, kept in one place so it is cheap to adjust if scan testing
 * shows a bank expects something different.
 */
export const TAG = {
  FORMAT: "00",
  INITIATION: "01",
  RESERVED: "02",
  IBAN: "04",
  AMOUNT: "05",
  EXPIRY: "07",
  CRC: "10",
};

const FORMAT_VERSION = "02";
const RESERVED_VALUE = "00";
const STATIC = "11";
const DYNAMIC = "12";

export class PayloadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PayloadError";
    this.code = code;
  }
}

/** Expiry is carried as DDMMYYYYHHmm. Accepts YYYY-MM-DD or YYYY-MM-DDTHH:mm. */
function encodeExpiry(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour = "23", minute = "59"] = match;
  const probe = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute));

  // reject dates that rolled over, e.g. 2026-02-31
  const roundTripped =
    probe.getUTCFullYear() === +year &&
    probe.getUTCMonth() === +month - 1 &&
    probe.getUTCDate() === +day &&
    probe.getUTCHours() === +hour &&
    probe.getUTCMinutes() === +minute;

  return roundTripped ? day + month + year + hour + minute : null;
}

/** Default expiry for a priced QR: end of the following day. */
export function defaultExpiry(now = new Date()) {
  const next = new Date(now.getTime());
  next.setDate(next.getDate() + 1);

  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Build a payment payload.
 *
 * @param {object} options
 * @param {string} options.iban    Pakistani IBAN, spaces and case are forgiven
 * @param {string|number} [options.amount]  omit for a static "any amount" QR
 * @param {string} [options.expiry]         YYYY-MM-DD or YYYY-MM-DDTHH:mm
 * @param {Date}   [options.now]            injectable clock, for tests
 * @returns {string}
 */
export function buildPayload({ iban, amount, expiry, now } = {}) {
  const account = normalizeIban(iban);
  if (!isValidIban(account)) {
    throw new PayloadError("INVALID_IBAN", `Not a valid Pakistani IBAN: ${iban}`);
  }

  const value = normalizeAmount(amount);
  if (value === null) {
    throw new PayloadError(
      "INVALID_AMOUNT",
      "Amount must be positive with at most two decimal places."
    );
  }

  // an unpriced QR stays static and carries no expiry
  const wanted = expiry || (value ? defaultExpiry(now) : "");
  const expiresAt = wanted ? encodeExpiry(wanted) : "";
  if (wanted && !expiresAt) {
    throw new PayloadError("INVALID_EXPIRY", `Not a valid date: ${wanted}`);
  }

  let payload =
    encodeField(TAG.FORMAT, FORMAT_VERSION) +
    encodeField(TAG.INITIATION, value || expiresAt ? DYNAMIC : STATIC) +
    encodeField(TAG.RESERVED, RESERVED_VALUE) +
    encodeField(TAG.IBAN, account);

  if (value) payload += encodeField(TAG.AMOUNT, value);
  if (expiresAt) payload += encodeField(TAG.EXPIRY, expiresAt);

  // the CRC covers everything including its own tag and length
  payload += TAG.CRC + "04";
  return payload + crc16(payload);
}

/** Read a payload back into its parts, verifying the checksum. */
export function parsePayload(payload) {
  if (typeof payload !== "string" || payload.length < 8) {
    throw new PayloadError("INVALID_PAYLOAD", "Payload is too short to parse.");
  }

  const marker = payload.lastIndexOf(TAG.CRC + "04");
  if (marker === -1) {
    throw new PayloadError("MISSING_CRC", "Payload has no checksum field.");
  }

  const expected = crc16(payload.slice(0, marker + 4));
  const actual = payload.slice(marker + 4);
  if (expected !== actual) {
    throw new PayloadError(
      "BAD_CRC",
      `Checksum mismatch: payload says ${actual}, computed ${expected}.`
    );
  }

  const result = { fields: decodeFields(payload), iban: "", amount: "", expiry: "" };

  for (const field of result.fields) {
    if (field.tag === TAG.IBAN) result.iban = field.value;
    if (field.tag === TAG.AMOUNT) result.amount = field.value;
    if (field.tag === TAG.EXPIRY) {
      const v = field.value;
      result.expiry = `${v.slice(4, 8)}-${v.slice(2, 4)}-${v.slice(0, 2)}T${v.slice(8, 10)}:${v.slice(10, 12)}`;
    }
  }

  result.isDynamic =
    result.fields.find((f) => f.tag === TAG.INITIATION)?.value === DYNAMIC;

  return result;
}
