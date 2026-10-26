"use client";

import SectionSettings from "../../../components/admin/SectionSettings";

const FIELDS = [
  { key: "pixel_id", label: "Meta Pixel ID", placeholder: "1234567890123456" },
  { key: "test_event_code", label: "Test event code", placeholder: "TEST12345", help: "From Meta Events Manager → Test events. Use while validating Pixel and Conversions API." },
  { key: "capi_access_token", label: "Conversions API access token", type: "password", placeholder: "EAAB...", help: "Generate in Meta Events Manager. Stored in Kidlo (MySQL/JSON) and used only on the server when an order is placed." },
  { key: "capi_enabled", label: "Send server-side Purchase events (Conversions API)", type: "toggle" },
  { key: "track_page_view", label: "Track PageView", type: "toggle" },
  { key: "track_view_content", label: "Track ViewContent on product pages", type: "toggle" },
  { key: "track_add_to_cart", label: "Track AddToCart", type: "toggle" },
  { key: "track_initiate_checkout", label: "Track InitiateCheckout", type: "toggle" },
  { key: "track_purchase", label: "Track Purchase in the browser Pixel", type: "toggle" },
  { key: "notes", label: "Internal notes", type: "textarea", wide: true },
];

export default function MetaAdsAdmin() {
  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Meta Ads & Pixel</h1>
          <p className="muted" style={{ maxWidth: 760 }}>Connect Meta Pixel for Facebook and Instagram ads, remarketing, and conversion tracking. Optional Conversions API improves match rates when cookies are blocked.</p>
        </div>
      </div>
      <SectionSettings sectionKey="meta_ads" title="Meta Pixel settings" fields={FIELDS} enabledLabel="Meta Pixel live on storefront">
        {(draft) => (
          <div className="marketing-guide">
            <div>
              <h3>Events Kidlo sends</h3>
              <ul>
                <li>PageView on store pages {draft.payload.track_page_view ? "✓" : "off"}</li>
                <li>ViewContent on product pages {draft.payload.track_view_content ? "✓" : "off"}</li>
                <li>AddToCart from the cart {draft.payload.track_add_to_cart ? "✓" : "off"}</li>
                <li>InitiateCheckout on checkout {draft.payload.track_initiate_checkout ? "✓" : "off"}</li>
                <li>Purchase after order placed {draft.payload.track_purchase ? "✓" : "off"}</li>
                <li>Server Purchase (CAPI) {draft.payload.capi_enabled && draft.payload.capi_access_token ? "✓" : "off"}</li>
              </ul>
            </div>
            <div>
              <h3>Setup in Meta Events Manager</h3>
              <ol>
                <li>Create or open your Pixel and paste the Pixel ID above.</li>
                <li>Use Test events with the test code while browsing the store.</li>
                <li>For CAPI, generate an access token with <em>ads_management</em> and enable server-side Purchase.</li>
                <li>Build ad campaigns in Meta Ads Manager using standard purchase or add-to-cart audiences.</li>
              </ol>
            </div>
          </div>
        )}
      </SectionSettings>
    </>
  );
}
