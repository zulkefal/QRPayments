import QRCode from "qrcode";

/**
 * Turn a payload into an SVG path, so a renderer can draw the code as real
 * markup instead of injecting a string of HTML.
 */
export function toSvgPath(payload, { errorCorrectionLevel = "H", margin = 2 } = {}) {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel });
  const { size, data } = modules;

  let path = "";
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (data[row * size + col]) {
        path += `M${col + margin},${row + margin}h1v1h-1z`;
      }
    }
  }

  return { path, extent: size + margin * 2 };
}
