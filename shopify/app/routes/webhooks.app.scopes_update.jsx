import { webhookAction } from "../webhook.server";
import db from "../db.server";

// Keep the stored session scope in sync when the merchant updates permissions.
export const action = webhookAction(async ({ payload, session, topic, shop }) => {
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await db.session.update({
      where: { id: session.id },
      data: { scope: payload.current.toString() },
    });
  }
});
