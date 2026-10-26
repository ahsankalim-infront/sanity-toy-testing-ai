const crypto = require("crypto");

function sectionPayload(sections, key) {
  const row = sections.find((item) => item.section_key === key);
  if (!row || !row.enabled) return null;
  return row.payload || null;
}

function googleEnvDefaults() {
  return {
    site_verification: String(process.env.GOOGLE_SITE_VERIFICATION || "").trim(),
    ga4_measurement_id: String(process.env.GA4_MEASUREMENT_ID || process.env.GOOGLE_ANALYTICS_ID || "").trim(),
    gtm_container_id: String(process.env.GTM_CONTAINER_ID || process.env.GOOGLE_TAG_MANAGER_ID || "").trim(),
    google_ads_conversion_id: String(process.env.GOOGLE_ADS_CONVERSION_ID || "").trim(),
    google_ads_conversion_label: String(process.env.GOOGLE_ADS_CONVERSION_LABEL || "").trim(),
    prefer_gtm: process.env.GOOGLE_PREFER_GTM === "1" ? 1 : 0,
  };
}

function mergeGooglePayload(payload) {
  const env = googleEnvDefaults();
  const merged = {
    site_verification: String(payload?.site_verification || env.site_verification || "").trim(),
    ga4_measurement_id: String(payload?.ga4_measurement_id || env.ga4_measurement_id || "").trim(),
    gtm_container_id: String(payload?.gtm_container_id || env.gtm_container_id || "").trim(),
    google_ads_conversion_id: String(payload?.google_ads_conversion_id || env.google_ads_conversion_id || "").trim(),
    google_ads_conversion_label: String(payload?.google_ads_conversion_label || env.google_ads_conversion_label || "").trim(),
    prefer_gtm: payload?.prefer_gtm !== undefined ? Number(payload.prefer_gtm) : Number(env.prefer_gtm),
    track_purchase: payload?.track_purchase !== undefined ? payload.track_purchase : 1,
  };
  const sources = {
    site_verification: payload?.site_verification ? "admin" : env.site_verification ? "env" : "",
    ga4_measurement_id: payload?.ga4_measurement_id ? "admin" : env.ga4_measurement_id ? "env" : "",
    gtm_container_id: payload?.gtm_container_id ? "admin" : env.gtm_container_id ? "env" : "",
  };
  return { merged, sources };
}

function publicGoogleMarketing(sections) {
  const payload = sectionPayload(sections, "google_marketing");
  if (!payload) return null;
  const { merged } = mergeGooglePayload(payload);
  const ga4 = merged.ga4_measurement_id;
  const gtm = merged.gtm_container_id;
  const adsId = merged.google_ads_conversion_id;
  if (!ga4 && !gtm && !adsId && !merged.site_verification) return null;
  return {
    site_verification: merged.site_verification,
    ga4_measurement_id: ga4,
    gtm_container_id: gtm,
    google_ads_conversion_id: adsId,
    google_ads_conversion_label: merged.google_ads_conversion_label,
    prefer_gtm: Boolean(Number(merged.prefer_gtm)),
    track_purchase: merged.track_purchase !== 0,
  };
}

function adminGoogleMarketing(sections) {
  const row = sections.find((item) => item.section_key === "google_marketing");
  if (!row) return { enabled: false, storefront: null, sources: {} };
  const { merged, sources } = mergeGooglePayload(row.payload);
  const storefront = row.enabled ? publicGoogleMarketing(sections) : null;
  return {
    enabled: Boolean(row.enabled),
    draft: merged,
    sources,
    storefront,
    configured: Boolean(merged.site_verification || merged.ga4_measurement_id || merged.gtm_container_id),
  };
}

function publicMetaAds(sections) {
  const payload = sectionPayload(sections, "meta_ads");
  if (!payload) return null;
  const pixelId = String(payload.pixel_id || "").trim();
  if (!pixelId) return null;
  return {
    pixel_id: pixelId,
    test_event_code: String(payload.test_event_code || "").trim(),
    track_page_view: payload.track_page_view !== 0,
    track_view_content: payload.track_view_content !== 0,
    track_add_to_cart: payload.track_add_to_cart !== 0,
    track_initiate_checkout: payload.track_initiate_checkout !== 0,
    track_purchase: payload.track_purchase !== 0,
  };
}

function marketingPublic(sections) {
  return {
    google: publicGoogleMarketing(sections),
    meta: publicMetaAds(sections),
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

function metaUserData(order) {
  const data = {};
  if (order.email) data.em = [sha256(order.email)];
  if (order.phone) {
    const digits = String(order.phone).replace(/\D/g, "");
    if (digits) data.ph = [sha256(digits)];
  }
  if (order.customer_name) {
    const parts = String(order.customer_name).trim().split(/\s+/);
    if (parts[0]) data.fn = [sha256(parts[0])];
    if (parts.length > 1) data.ln = [sha256(parts.slice(1).join(" "))];
  }
  if (order.city) data.ct = [sha256(order.city)];
  if (order.country_code) data.country = [sha256(String(order.country_code).toLowerCase())];
  return data;
}

async function sendMetaCapiPurchase({ order, items, sections, eventSourceUrl }) {
  const payload = sectionPayload(sections, "meta_ads");
  if (!payload || !Number(payload.capi_enabled)) return;
  const pixelId = String(payload.pixel_id || "").trim();
  const token = String(payload.capi_access_token || "").trim();
  if (!pixelId || !token || payload.track_purchase === 0) return;

  const contents = (items || []).map((line) => ({
    id: String(line.product_id || line.id),
    quantity: Number(line.qty) || 1,
    item_price: Number(line.price) || 0,
  }));
  const body = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `kidlo-${order.order_no}`,
      action_source: "website",
      event_source_url: eventSourceUrl || "",
      user_data: metaUserData(order),
      custom_data: {
        currency: "PKR",
        value: Number(order.total) || 0,
        order_id: order.order_no,
        contents,
        content_type: "product",
        num_items: contents.reduce((sum, row) => sum + row.quantity, 0),
      },
    }],
    access_token: token,
  };
  if (payload.test_event_code) body.test_event_code = String(payload.test_event_code).trim();

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || "Meta Conversions API request failed");
  return data;
}

function normalizeGooglePatch(payload) {
  const next = { ...payload };
  if (next.ga4_measurement_id) next.ga4_measurement_id = String(next.ga4_measurement_id).trim();
  if (next.gtm_container_id) next.gtm_container_id = String(next.gtm_container_id).trim().toUpperCase();
  if (next.site_verification) next.site_verification = String(next.site_verification).trim();
  return next;
}

module.exports = {
  marketingPublic,
  publicGoogleMarketing,
  publicMetaAds,
  adminGoogleMarketing,
  mergeGooglePayload,
  normalizeGooglePatch,
  sendMetaCapiPurchase,
};
