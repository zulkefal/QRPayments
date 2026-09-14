import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteError,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getSettings,
  publishSettings,
  saveSettings,
} from "../models/settings.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return { settings: await getSettings(session.shop) };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();

  const submitted = {
    iban: form.get("iban"),
    accountTitle: form.get("accountTitle"),
    bankName: form.get("bankName"),
  };

  let result;
  try {
    result = await saveSettings(session.shop, submitted);
  } catch (error) {
    // A database failure (Neon cold start, network blip) must never surface
    // as a crash page. Tell the merchant plainly and keep what they typed.
    console.error("saveSettings failed:", error);
    return {
      errors: {},
      saved: false,
      saveError:
        "Could not save right now — the database did not respond. Please try again in a moment.",
      publishErrors: [],
      settings: submitted,
    };
  }

  // the extension reads a metafield, so saving is only half the job
  const publishErrors = result.saved
    ? await publishSettings(admin, result.settings)
    : [];

  return {
    errors: result.errors,
    saved: Boolean(result.saved),
    publishErrors,
    settings: result.settings,
    suggestedBank: result.suggestedBank,
  };
};

export default function SettingsPage() {
  const { settings } = useLoaderData();
  const result = useActionData();
  const navigation = useNavigation();

  const saving = navigation.state === "submitting";
  const errors = result?.errors ?? {};
  // after a failed save, keep what the merchant typed rather than reverting
  const current = result?.settings ?? settings ?? {};

  return (
    <s-page heading="Bank transfer settings">
      {result?.saveError ? (
        <s-banner tone="critical">{result.saveError}</s-banner>
      ) : null}

      {result?.saved && !result.publishErrors?.length ? (
        <s-banner tone="success">
          Saved. Shoppers who choose bank transfer will see a QR code for this
          account.
        </s-banner>
      ) : null}

      {result?.publishErrors?.length ? (
        <s-banner tone="warning">
          Your details were saved, but could not be sent to the checkout page:{" "}
          {result.publishErrors.join(" ")} Shoppers will not see a QR code until
          this is fixed.
        </s-banner>
      ) : null}

      <s-section heading="Where your money goes">
        <s-paragraph>
          Shoppers scan a QR code with their banking app instead of copying your
          account number. The amount is filled in for them.
        </s-paragraph>

        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="IBAN"
              name="iban"
              defaultValue={current.iban ?? ""}
              error={errors.iban}
              placeholder="PK51UNIL0109000262456845"
              details="The account shoppers will send money to."
              required
            />
            <s-text-field
              label="Account title"
              name="accountTitle"
              defaultValue={current.accountTitle ?? ""}
              error={errors.accountTitle}
              placeholder="Your registered business name"
              details="Shown on the shopper's transfer screen. Enter it exactly as your bank shows it — if it does not match your store name, shoppers abandon the payment."
              required
            />
            <s-text-field
              label="Bank name"
              name="bankName"
              defaultValue={current.bankName ?? ""}
            />
            <s-button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section slot="aside" heading="Setup">
        <s-paragraph>
          Saving your account is step one. Two more steps happen in your Shopify
          settings — see the Setup page.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
