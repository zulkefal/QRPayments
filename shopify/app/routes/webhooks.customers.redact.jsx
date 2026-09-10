import { authenticate } from "../shopify.server";

/**
 * A request to erase a specific customer's data. Required for App Store
 * distribution.
 *
 * This app stores nothing about shoppers — only the merchant's own bank
 * details — so there is nothing to erase. Acknowledge so Shopify records the
 * request as handled.
 */
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`${topic} for ${shop}: no customer data is stored`);

  return new Response();
};
