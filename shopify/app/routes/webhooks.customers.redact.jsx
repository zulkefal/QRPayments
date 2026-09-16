import { webhookAction } from "../webhook.server";

// This app stores no shopper data, so there is nothing to erase. Acknowledge so
// Shopify records the request as handled. Required for App Store distribution.
export const action = webhookAction(async ({ shop, topic }) => {
  console.log(`${topic} for ${shop}: no customer data is stored`);
});
