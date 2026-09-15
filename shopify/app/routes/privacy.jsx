/**
 * Public privacy policy. App Store submission requires a hosted policy URL, and
 * this serves one from the app itself: https://<app-host>/privacy
 *
 * It is a resource route returning standalone HTML, so it renders with no
 * Shopify auth and none of the embedded app chrome.
 *
 * Keep this truthful to what the app actually does. If data handling changes,
 * change this page in the same commit.
 */
const APP_NAME = "Scan To Pay";
const SUPPORT_EMAIL = "support@example.com"; // TODO: set your real support email
const UPDATED = "15 September 2026";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${APP_NAME} — Privacy Policy</title>
<style>
  :root { color-scheme: light dark; }
  body { max-width: 44rem; margin: 0 auto; padding: 2rem 1.25rem 4rem;
    font: 16px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  h1 { font-size: 1.6rem; margin-bottom: .25rem; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .updated { color: #667; font-size: .9rem; }
  code { background: rgba(128,128,128,.15); padding: .1em .35em; border-radius: 4px; }
  ul { padding-left: 1.25rem; }
</style>
</head>
<body>
<h1>${APP_NAME} — Privacy Policy</h1>
<p class="updated">Last updated: ${UPDATED}</p>

<p>${APP_NAME} lets a Shopify merchant show a bank-transfer payment QR code to
their shoppers. This policy explains what the app stores, why, and how it is
deleted.</p>

<h2>What the app stores</h2>
<p>When a merchant installs and configures ${APP_NAME}, the app stores, per shop:</p>
<ul>
  <li>The store's <code>myshopify.com</code> domain.</li>
  <li>A Shopify access token, used only to authenticate the app's own requests to Shopify.</li>
  <li>The bank details the merchant enters: IBAN, account title, and bank name.</li>
</ul>
<p>The bank details are also written to a Shopify metafield on the store so the
payment code can be shown at checkout. That metafield is controlled by the
merchant's own Shopify account.</p>

<h2>What the app does not store</h2>
<p>${APP_NAME} does <strong>not</strong> collect, store, or process any personal
data about shoppers. It reads the order total in the shopper's browser to draw
the code and keeps nothing. It requests no access to customer or order data from
Shopify.</p>

<h2>How the data is used</h2>
<p>The stored bank details are used for one purpose: to generate the payment QR
code and account information shown to shoppers who choose to pay by bank
transfer. The data is never sold, shared, or used for advertising.</p>

<h2>Payments</h2>
<p>${APP_NAME} does not process payments and never handles money. Payment is made
directly by the shopper to the merchant's bank account, outside Shopify and
outside this app. The app only displays the information needed to make that
transfer.</p>

<h2>Data retention and deletion</h2>
<p>The merchant's bank details and access token are deleted automatically when
the app is uninstalled, and again if Shopify sends a shop-redaction request. A
merchant may also remove or change their details at any time from the app's
settings page. Because no shopper data is stored, there is nothing to return or
erase in response to a customer data request.</p>

<h2>Contact</h2>
<p>Questions about this policy or your data: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
</body>
</html>`;

export const loader = () =>
  new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
