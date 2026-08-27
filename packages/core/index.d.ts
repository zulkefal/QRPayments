/** Options accepted when building a payment payload. */
export interface PayloadOptions {
  /** Pakistani IBAN. Spaces and lower case are forgiven. */
  iban: string;
  /** Pass money as a string ("2500.00"). Omit for a static "any amount" code. */
  amount?: string | number;
  /** `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`. Defaults to end of the next day. */
  expiry?: string;
  /** Injectable clock, for tests. */
  now?: Date;
}

export interface PayloadField {
  tag: string;
  length: number;
  value: string;
}

export interface ParsedPayload {
  fields: PayloadField[];
  iban: string;
  /** Empty string when the code carries no amount. */
  amount: string;
  /** `YYYY-MM-DDTHH:mm`, or empty when the code has no expiry. */
  expiry: string;
  isDynamic: boolean;
}

export type PayloadErrorCode =
  | "INVALID_IBAN"
  | "INVALID_AMOUNT"
  | "INVALID_EXPIRY"
  | "INVALID_PAYLOAD"
  | "MISSING_CRC"
  | "BAD_CRC";

export class PayloadError extends Error {
  readonly name: "PayloadError";
  readonly code: PayloadErrorCode;
  constructor(code: PayloadErrorCode, message: string);
}

export const TAG: {
  readonly FORMAT: string;
  readonly INITIATION: string;
  readonly RESERVED: string;
  readonly IBAN: string;
  readonly AMOUNT: string;
  readonly EXPIRY: string;
  readonly CRC: string;
};

/** @throws {PayloadError} on invalid input. */
export function buildPayload(options: PayloadOptions): string;
/** @throws {PayloadError} when the payload is malformed or fails its checksum. */
export function parsePayload(payload: string): ParsedPayload;
export function defaultExpiry(now?: Date): string;

export function isValidIban(value: unknown): boolean;
export function normalizeIban(value: unknown): string;
/** Four-letter bank code from an IBAN, or "" if it is not a valid PK IBAN. */
export function bankCode(value: unknown): string;
/** Groups an IBAN into fours for display. */
export function formatIban(value: unknown): string;

/** Payload-ready amount, "" when omitted, or null when unusable. */
export function normalizeAmount(value: unknown): string | null;

export function encodeField(tag: string, value: string | number): string;
export function decodeFields(payload: string): PayloadField[];
export function crc16(input: string): string;

export interface QrStyle {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  color?: { dark?: string; light?: string };
}

export const DEFAULT_STYLE: QrStyle;
export function renderPng(options: PayloadOptions & { style?: QrStyle }): Promise<Buffer>;
export function renderSvg(options: PayloadOptions & { style?: QrStyle }): Promise<string>;

/** An SVG path for the code, plus the viewBox extent in modules. */
export function toSvgPath(
  payload: string,
  options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H"; margin?: number }
): { path: string; extent: number };

export interface BankSuggestion {
  /** Empty when the bank code is not recognised. */
  name: string;
  code: string;
  /** False when unrecognised — show a blank field rather than a guess. */
  confident: boolean;
}

export function suggestBank(bankCode: string): BankSuggestion;
export function knownBankCodes(): string[];

export interface MerchantSettings {
  iban: string;
  accountTitle: string;
  bankName: string;
}

export interface SettingsResult {
  valid: boolean;
  errors: Partial<Record<"iban" | "accountTitle", string>>;
  settings: MerchantSettings;
  suggestedBank: BankSuggestion;
}

export function validateSettings(input: Partial<MerchantSettings>): SettingsResult;
