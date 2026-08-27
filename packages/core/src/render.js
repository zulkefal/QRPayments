import QRCode from "qrcode";
import { buildPayload } from "./index.js";

/** Dark green reads as "paid" locally and keeps contrast high against white. */
export const DEFAULT_STYLE = {
  width: 600,
  margin: 4,
  errorCorrectionLevel: "H",
  color: { dark: "#01411C", light: "#FFFFFF" },
};

export async function renderPng({ iban, amount, expiry, style }) {
  const payload = buildPayload({ iban, amount, expiry });
  return QRCode.toBuffer(payload, { ...DEFAULT_STYLE, ...style, type: "png" });
}

export async function renderSvg({ iban, amount, expiry, style }) {
  const payload = buildPayload({ iban, amount, expiry });
  return QRCode.toString(payload, { ...DEFAULT_STYLE, ...style, type: "svg" });
}
