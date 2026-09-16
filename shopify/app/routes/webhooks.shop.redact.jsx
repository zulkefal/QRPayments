import { webhookAction } from "../webhook.server";
import { eraseShop } from "../models/shop-data.server";

// Sent 48 hours after uninstall. Everything we hold for the shop must be gone.
// Required for App Store distribution.
export const action = webhookAction(async ({ shop, topic }) => {
  const erased = await eraseShop(shop);
  console.log(`${topic} for ${shop}: erased`, erased);
});
