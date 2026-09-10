import { authenticate } from "../shopify.server";
import { eraseShop } from "../models/shop-data.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  // Erase unconditionally rather than only when a session survives. This
  // webhook is delivered more than once and can arrive after the session is
  // gone, and a merchant's bank details must not outlive the install.
  const erased = await eraseShop(shop);
  console.log(`${topic} for ${shop}: erased`, erased);

  return new Response();
};
