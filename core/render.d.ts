import type { PayloadOptions } from "./index.js";

export interface QrStyle {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  color?: { dark?: string; light?: string };
}

export const DEFAULT_STYLE: QrStyle;

/** Render a payment code as a PNG. Requires the `qrcode` dependency. */
export function renderPng(
  options: PayloadOptions & { style?: QrStyle }
): Promise<Buffer>;

/** Render a payment code as an SVG string. Requires the `qrcode` dependency. */
export function renderSvg(
  options: PayloadOptions & { style?: QrStyle }
): Promise<string>;

/** An SVG path for the code, plus the viewBox extent in modules. */
export function toSvgPath(
  payload: string,
  options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H"; margin?: number }
): { path: string; extent: number };
