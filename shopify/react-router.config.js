/**
 * React Router 7.18+ rejects action POSTs whose `Origin` header does not match
 * the origin the server reconstructs from the request. Render terminates TLS
 * at its proxy and forwards plain HTTP, and `react-router-serve` never enables
 * Express's `trust proxy`, so the server sees `http://<host>` while the browser
 * sent `https://<host>` — every Save failed with a 400 "Bad Request" before the
 * action ran.
 *
 * `allowedActionOrigins` is the library's sanctioned escape hatch for proxied
 * deployments. Entries are bare hosts, matched against the `Origin` header's
 * host. Only our own host is listed: the app is embedded in Shopify admin and
 * authenticates every request with a session token, not a cookie, so this does
 * not open a CSRF hole.
 *
 * Add any custom domain here too, or set SHOPIFY_APP_URL at build time and it
 * is picked up automatically.
 */
const fromEnv = (() => {
  try {
    // eslint-disable-next-line no-undef
    return process.env.SHOPIFY_APP_URL ? new URL(process.env.SHOPIFY_APP_URL).host : null;
  } catch {
    return null;
  }
})();

const allowedActionOrigins = [...new Set(["qrpayments-1jx1.onrender.com", fromEnv].filter(Boolean))];

export default {
  ssr: true,
  allowedActionOrigins,
};
