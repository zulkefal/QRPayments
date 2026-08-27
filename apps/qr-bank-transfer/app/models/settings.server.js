import { validateSettings } from "@qrpayments/raast-qr";
import prisma from "../db.server";

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
