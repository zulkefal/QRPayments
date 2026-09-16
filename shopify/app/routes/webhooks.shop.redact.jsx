import { authenticate } from "../shopify.server";
import { eraseShop } from "../models/shop-data.server";

/**
 * Sent 48 hours after a shop uninstalls the app. Everything we hold for that
 * shop must be gone. Required for App Store distribution.
 */
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  // Acknowledge reliably. A DB error must not make this webhook fail delivery;
  // eraseShop is idempotent and uninstall runs it too, so the data is still
  // erased even if one delivery has a transient database problem.
  try {
    const erased = await eraseShop(shop);
    console.log(`${topic} for ${shop}: erased`, erased);
  } catch (error) {
    console.error(`${topic} for ${shop}: erase failed`, error);
  }

  return new Response();
};
