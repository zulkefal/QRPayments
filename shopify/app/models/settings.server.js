import { validateSettings } from "@qrpayments/raast-qr";
import prisma from "../db.server";

export const METAFIELD_NAMESPACE = "$app";
export const METAFIELD_KEY = "bank_settings";

/**
 * A shop's bank details. Returns null when setup has not happened yet, which
 * the onboarding checklist reads as its first unfinished step.
 */
export async function getSettings(shop) {
  return prisma.shopSettings.findUnique({ where: { shop } });
}

/**
 * Validate and store. Returns the same shape as `validateSettings`, with
 * `saved` set when it reached the database — the caller re-renders the form
 * with `errors` when it did not.
 */
export async function saveSettings(shop, input) {
  const result = validateSettings(input);
  if (!result.valid) return { ...result, saved: null };

  const saved = await prisma.shopSettings.upsert({
    where: { shop },
    update: result.settings,
    create: { shop, ...result.settings },
  });

  return { ...result, saved };
}

/**
 * Copy the settings into a shop metafield so the checkout extension can read
 * them without a network call. The database stays the source of truth; this is
 * the published copy.
 *
 * Returns a list of error messages rather than throwing — a merchant whose
 * details saved but failed to publish needs to be told precisely that, not
 * shown a crash.
 */
export async function publishSettings(admin, settings) {
  const shopResponse = await admin.graphql(`#graphql
    query ShopId {
      shop { id }
    }
  `);
  const { data: shopData } = await shopResponse.json();
  const ownerId = shopData?.shop?.id;
  if (!ownerId) return ["Could not identify the shop to publish settings to."];

  const response = await admin.graphql(
    `#graphql
      mutation PublishBankSettings($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY,
            type: "json",
            value: JSON.stringify({
              iban: settings.iban,
              accountTitle: settings.accountTitle,
              bankName: settings.bankName,
            }),
          },
        ],
      },
    }
  );

  const { data } = await response.json();
  return (data?.metafieldsSet?.userErrors ?? []).map((e) => e.message);
}
