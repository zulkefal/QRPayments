import "@shopify/ui-extensions/preact";
import { render } from "preact";

export default async () => {
  render(<Extension />, document.body);
};

// Absolute minimum: no globals, no hooks, no data. If this does not appear,
// the problem is registration, not the component.
function Extension() {
  return <s-banner heading="QR TEST">If you can read this, it mounts.</s-banner>;
}
