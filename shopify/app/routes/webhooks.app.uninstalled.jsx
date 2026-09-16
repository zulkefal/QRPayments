import { webhookAction } from "../webhook.server";
import { eraseShop } from "../models/shop-data.server";

// Erase the shop's data on uninstall. eraseShop is idempotent and is also run
// by shop/redact, so a rare failure here is covered.
export const action = webhookAction(async ({ shop, topic }) => {
  const erased = await eraseShop(shop);
  console.log(`${topic} for ${shop}: erased`, erased);
});
