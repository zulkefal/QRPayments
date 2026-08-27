import "@shopify/ui-extensions/preact";
import { render } from "preact";

export default async () => {
  render(<Extension />, document.body);
};

// TEMPORARY: renders unconditionally so we can see what the extension sees.
function Extension() {
  const metafields = shopify.appMetafields?.value ?? [];
  const cost = shopify.cost;

  return (
    <s-section heading="DEBUG — bank transfer QR">
      <s-stack direction="block" gap="small-500">
        <s-text>MOUNTED — target {shopify.extension?.target}</s-text>
        <s-text>metafields: {metafields.length}</s-text>
        {metafields.map((m, i) => (
          <s-text key={i}>
            [{m.target?.type}] {m.metafield?.namespace}.{m.metafield?.key} ={" "}
            {String(m.metafield?.value).slice(0, 60)}
          </s-text>
        ))}
        <s-text>
          total: {String(cost?.totalAmount?.value?.amount)}{" "}
          {String(cost?.totalAmount?.value?.currencyCode)}
        </s-text>
      </s-stack>
    </s-section>
  );
}
