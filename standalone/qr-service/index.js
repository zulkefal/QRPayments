import { createServer } from "node:http";
import { PayloadError } from "@qrpayments/raast-qr";
import { renderPng, renderSvg } from "@qrpayments/raast-qr/render";

const PORT = Number(process.env.PORT || 3000);

/**
 * Renders payment QR codes for the Shopify extension to point an <Image> at.
 * Checkout UI extensions cannot draw a QR themselves, so they load one from here.
 */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/healthz") {
    return send(res, 200, { "content-type": "application/json" }, JSON.stringify({ ok: true }));
  }

  const svg = url.pathname === "/qr.svg";
  if (url.pathname !== "/qr.png" && !svg) {
    return send(res, 404, { "content-type": "application/json" },
      JSON.stringify({ error: "not found" }));
  }

  const iban = url.searchParams.get("iban");
  const amount = url.searchParams.get("amount") ?? undefined;
  const expiry = url.searchParams.get("expiry") ?? undefined;
  const width = Number(url.searchParams.get("width")) || undefined;

  try {
    const style = width ? { width: Math.min(Math.max(width, 120), 1200) } : undefined;
    const body = svg
      ? await renderSvg({ iban, amount, expiry, style })
      : await renderPng({ iban, amount, expiry, style });

    send(res, 200, {
      "content-type": svg ? "image/svg+xml" : "image/png",
      // the same inputs always produce the same image, so let it cache hard
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": Buffer.byteLength(body),
    }, body);
  } catch (error) {
    if (error instanceof PayloadError) {
      return send(res, 400, { "content-type": "application/json" },
        JSON.stringify({ error: error.message, code: error.code }));
    }
    console.error(error);
    send(res, 500, { "content-type": "application/json" },
      JSON.stringify({ error: "render failed" }));
  }
});

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

server.listen(PORT, () => console.log(`qr service on http://localhost:${PORT}`));
