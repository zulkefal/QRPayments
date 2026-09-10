import prisma from "../db.server";

/**
 * Erase everything we hold for a shop.
 *
 * Called when an app is uninstalled and when Shopify sends a redaction
 * request. Keeping a merchant's bank details after they have removed the app
 * is both wrong and something App Store review asks about.
 *
 * Safe to call repeatedly — webhooks are delivered more than once, and may
 * arrive after the data is already gone.
 */
export async function eraseShop(shop) {
  const [settings, sessions] = await prisma.$transaction([
    prisma.shopSettings.deleteMany({ where: { shop } }),
    prisma.session.deleteMany({ where: { shop } }),
  ]);

  return { settings: settings.count, sessions: sessions.count };
}
