import { authenticate } from "./shopify.server";

/**
 * Wrap a webhook handler so it can never return a 500.
 *
 * Shopify marks any non-2xx (or slow) delivery as failed and retries it, which
 * is what produced the high webhook failure rate. Genuine authentication
 * failures (401/400/405 Responses from authenticate.webhook) are returned as-is,
 * since those are the correct reply. Anything else — a database error, an
 * unexpected throw — is logged and acknowledged with 200, because the work here
 * (erasing a shop's data) is idempotent and re-run by other deliveries, so a
 * transient failure must not become a retry storm.
 */
export function webhookAction(handler) {
  return async ({ request }) => {
    let context;
    try {
      context = await authenticate.webhook(request);
    } catch (error) {
      if (error instanceof Response) return error;
      console.error("webhook authentication error:", error);
      return new Response();
    }

    try {
      await handler(context);
    } catch (error) {
      console.error(`webhook ${context.topic} handler error:`, error);
    }

    return new Response();
  };
}
