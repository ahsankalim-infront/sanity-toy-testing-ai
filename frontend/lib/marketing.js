"use client";

function cfg() {
  if (typeof window === "undefined") return null;
  return window.__kidloMarketing || null;
}

function gtagReady() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function fbqReady() {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export function setMarketingConfig(config) {
  if (typeof window === "undefined") return;
  window.__kidloMarketing = config || null;
}

export function trackGoogleEvent(name, params = {}) {
  const google = cfg()?.google;
  if (!google) return;
  if (gtagReady()) window.gtag("event", name, params);
  if (window.dataLayer) window.dataLayer.push({ event: name, ...params });
}

export function trackMetaEvent(name, params = {}, eventId) {
  const meta = cfg()?.meta;
  if (!meta || !fbqReady()) return;
  const options = eventId ? { eventID: eventId } : undefined;
  window.fbq("track", name, params, options);
}

export function trackViewContent(product) {
  const meta = cfg()?.meta;
  if (meta?.track_view_content && product) {
    trackMetaEvent("ViewContent", {
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
      value: Number(product.price) || 0,
      currency: "PKR",
    });
  }
  trackGoogleEvent("view_item", {
    currency: "PKR",
    value: Number(product?.price) || 0,
    items: product ? [{ item_id: String(product.id), item_name: product.name, price: Number(product.price) || 0 }] : [],
  });
}

export function trackAddToCart(product, qty = 1) {
  const meta = cfg()?.meta;
  if (meta?.track_add_to_cart && product) {
    trackMetaEvent("AddToCart", {
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
      value: (Number(product.price) || 0) * qty,
      currency: "PKR",
      num_items: qty,
    });
  }
  trackGoogleEvent("add_to_cart", {
    currency: "PKR",
    value: (Number(product?.price) || 0) * qty,
    items: product ? [{ item_id: String(product.id), item_name: product.name, quantity: qty, price: Number(product.price) || 0 }] : [],
  });
}

export function trackInitiateCheckout(cart, total) {
  const meta = cfg()?.meta;
  if (meta?.track_initiate_checkout) {
    trackMetaEvent("InitiateCheckout", {
      content_ids: cart.map((item) => String(item.id)),
      content_type: "product",
      value: Number(total) || 0,
      currency: "PKR",
      num_items: cart.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    });
  }
  trackGoogleEvent("begin_checkout", {
    currency: "PKR",
    value: Number(total) || 0,
    items: cart.map((item) => ({ item_id: String(item.id), item_name: item.name, quantity: item.qty, price: item.price })),
  });
}

export function trackPurchase(order, items = []) {
  const google = cfg()?.google;
  const meta = cfg()?.meta;
  const value = Number(order?.total) || 0;
  const eventId = order?.order_no ? `kidlo-${order.order_no}` : undefined;
  if (meta?.track_purchase) {
    trackMetaEvent("Purchase", {
      value,
      currency: "PKR",
      content_ids: items.map((line) => String(line.product_id || line.id)),
      content_type: "product",
      num_items: items.reduce((sum, line) => sum + Number(line.qty || 0), 0),
    }, eventId);
  }
  if (google?.track_purchase !== false) {
    trackGoogleEvent("purchase", {
      transaction_id: order?.order_no,
      value,
      currency: "PKR",
      items: items.map((line) => ({
        item_id: String(line.product_id || line.id),
        item_name: line.name,
        quantity: Number(line.qty) || 1,
        price: Number(line.price) || 0,
      })),
    });
    if (google.google_ads_conversion_id && google.google_ads_conversion_label && gtagReady()) {
      window.gtag("event", "conversion", {
        send_to: `${google.google_ads_conversion_id}/${google.google_ads_conversion_label}`,
        value,
        currency: "PKR",
        transaction_id: order?.order_no,
      });
    }
  }
}
