import { authenticate } from "../shopify.server";
import { eraseShop } from "../models/shop-data.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  // Erase the shop's data, but never let a slow or failing database turn this
  // into a non-200 or a response slower than Shopify's delivery timeout — that
  // is what drove the high webhook failure rate. eraseShop is idempotent and
  // is also run by shop/redact, so a rare miss here is covered.
  try {
    const erased = await eraseShop(shop);
    console.log(`${topic} for ${shop}: erased`, erased);
  } catch (error) {
    console.error(`${topic} for ${shop}: erase failed`, error);
  }

  return new Response();
};
