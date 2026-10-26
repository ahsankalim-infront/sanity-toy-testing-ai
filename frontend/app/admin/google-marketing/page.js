"use client";

import { useEffect, useState } from "react";
import SectionSettings from "../../../components/admin/SectionSettings";
import { adminHeaders } from "../../../components/admin/AdminShell";
import { api } from "../../../lib/format";

const FIELDS = [
  { key: "site_verification", label: "Google Search Console verification token", placeholder: "paste the content value from the HTML tag method", help: "In Search Console choose HTML tag verification and paste only the content value, not the full meta tag." },
  { key: "ga4_measurement_id", label: "GA4 measurement ID", placeholder: "G-XXXXXXXXXX", help: "Google Analytics → Admin → Data streams → your web stream → Measurement ID." },
  { key: "gtm_container_id", label: "Google Tag Manager container ID", placeholder: "GTM-XXXXXXX", help: "Optional. Use GTM if you manage GA4 and Ads tags inside one container." },
  { key: "prefer_gtm", label: "Load tags through GTM instead of direct GA4", type: "toggle" },
  { key: "google_ads_conversion_id", label: "Google Ads conversion ID", placeholder: "AW-XXXXXXXXX" },
  { key: "google_ads_conversion_label", label: "Google Ads conversion label", placeholder: "AbCdEfGhIjKlMnOpQr" },
  { key: "track_purchase", label: "Send purchase events to Google Analytics / Ads", type: "toggle" },
  { key: "notes", label: "Internal notes", type: "textarea", wide: true },
];

function siteBase() {
  if (typeof window === "undefined") return "https://your-store-domain.pk";
  return window.location.origin;
}

function statusLabel(live, value, empty = "not set") {
  if (!live) return empty;
  return value || empty;
}

export default function GoogleMarketingAdmin() {
  const [live, setLive] = useState(null);

  async function refreshLive() {
    try {
      setLive(await api("/api/admin/marketing/google", { headers: adminHeaders() }));
    } catch {
      setLive(null);
    }
  }

  useEffect(() => {
    refreshLive();
  }, []);

  const sitemapUrl = `${siteBase()}/sitemap.xml`;
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Google Search Console & Ads</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            Kidlo is integrated — add your Google IDs below (or set them in backend <code>.env</code>) and save. The store will load verification, analytics, and conversion tags automatically.
          </p>
        </div>
      </div>

      {live ? (
        <div className={`marketing-live ${live.storefront ? "on" : ""}`}>
          <strong>Storefront status:</strong>
          {live.storefront ? " live" : live.enabled ? " waiting for IDs — fill the form and save" : " off — turn on Google tags below"}
          {live.configured && live.storefront ? (
            <span className="marketing-live-detail">
              Search Console {live.storefront.site_verification ? "✓" : "—"} · Analytics {live.storefront.ga4_measurement_id || live.storefront.gtm_container_id ? "✓" : "—"}
            </span>
          ) : null}
        </div>
      ) : null}

      <SectionSettings sectionKey="google_marketing" title="Google marketing tags" fields={FIELDS} enabledLabel="Google tags live on storefront" onSaved={refreshLive}>
        {(draft) => {
          const effective = live?.draft || draft.payload;
          const storefront = live?.storefront;
          return (
            <div className="marketing-guide">
              <div>
                <h3>Connect Search Console</h3>
                <ol>
                  <li>Open <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Google Search Console</a> → Add property → URL prefix → your live domain.</li>
                  <li>Choose <strong>HTML tag</strong> verification and copy the <code>content=&quot;…&quot;</code> value into the field above.</li>
                  <li>Save here, open your store homepage, then click Verify in Search Console.</li>
                  <li>Submit sitemap: <code>{sitemapUrl}</code></li>
                </ol>
                <a className="btn btn-outline" href={pingUrl} target="_blank" rel="noopener noreferrer">Ping Google sitemap</a>
              </div>
              <div>
                <h3>Connect Analytics (GA4 or GTM)</h3>
                <ol>
                  <li>In <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Google Analytics</a>, create a GA4 property and web data stream.</li>
                  <li>Paste the Measurement ID (<code>G-…</code>) above, or paste a GTM container ID if you use Tag Manager.</li>
                  <li>Save, then visit the store and check Realtime in GA4 (may take a few minutes).</li>
                </ol>
                <h3>What loads on the store</h3>
                <ul>
                  <li>Search Console: <strong>{statusLabel(storefront?.site_verification || effective.site_verification, storefront?.site_verification ? "verification meta tag active" : effective.site_verification ? "saved — refresh store" : null)}</strong>{live?.sources?.site_verification === "env" ? " (from .env)" : ""}</li>
                  <li>Analytics: <strong>{storefront?.prefer_gtm && storefront?.gtm_container_id ? `GTM ${storefront.gtm_container_id}` : storefront?.ga4_measurement_id ? `GA4 ${storefront.ga4_measurement_id}` : effective.ga4_measurement_id || effective.gtm_container_id ? "saved — enable tags & save" : "not set"}</strong>{live?.sources?.ga4_measurement_id === "env" || live?.sources?.gtm_container_id === "env" ? " (from .env)" : ""}</li>
                  <li>Ads conversion: <strong>{storefront?.google_ads_conversion_id ? `${storefront.google_ads_conversion_id} / ${storefront.google_ads_conversion_label || "label missing"}` : "optional"}</strong></li>
                </ul>
              </div>
            </div>
          );
        }}
      </SectionSettings>
    </>
  );
}
