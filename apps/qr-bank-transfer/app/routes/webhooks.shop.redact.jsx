import { authenticate } from "../shopify.server";
import { eraseShop } from "../models/shop-data.server";

/**
 * Sent 48 hours after a shop uninstalls the app. Everything we hold for that
 * shop must be gone. Required for App Store distribution.
 */
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  const erased = await eraseShop(shop);
  console.log(`${topic} for ${shop}: erased`, erased);

  return new Response();
};
