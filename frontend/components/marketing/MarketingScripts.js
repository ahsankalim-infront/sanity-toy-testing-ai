"use client";

import Script from "next/script";
import { useEffect } from "react";
import { setMarketingConfig } from "../../lib/marketing";

export default function MarketingScripts({ marketing }) {
  const google = marketing?.google;
  const meta = marketing?.meta;
  const ga4 = google?.ga4_measurement_id;
  const gtm = google?.gtm_container_id;
  const useGtm = google?.prefer_gtm && gtm;
  const pixelId = meta?.pixel_id;

  useEffect(() => {
    setMarketingConfig(marketing);
  }, [marketing]);

  useEffect(() => {
    if (!meta?.track_page_view || !pixelId || typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [meta?.track_page_view, pixelId]);

  return (
    <>
      {useGtm ? (
        <>
          <Script id="kidlo-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>
          <noscript><iframe title="Google Tag Manager" src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>
        </>
      ) : null}
      {!useGtm && ga4 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="kidlo-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4}',{send_page_view:true});`}</Script>
        </>
      ) : null}
      {!useGtm && !ga4 && google?.google_ads_conversion_id ? (
        <Script id="kidlo-gads-base" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${google.google_ads_conversion_id}');`}</Script>
      ) : null}
      {pixelId ? (
        <Script id="kidlo-meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`}</Script>
      ) : null}
    </>
  );
}
