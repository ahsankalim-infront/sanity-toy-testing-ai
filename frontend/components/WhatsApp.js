"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const WhatsAppContext = createContext(null);

export function whatsappLink(settings, text) {
  const number = String(settings?.number || "").replace(/\D/g, "");
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text || settings.greeting || "")}`;
}

export function fillTemplate(template, values) {
  return String(template || "").replace(/\{(\w+)\}/g, (match, key) => (values[key] ?? match));
}

export function WhatsAppProvider({ settings, children }) {
  return <WhatsAppContext.Provider value={settings || null}>{children}</WhatsAppContext.Provider>;
}

export function useWhatsApp() {
  return useContext(WhatsAppContext);
}

export function WhatsAppFloat() {
  const settings = useWhatsApp();
  const path = usePathname();
  if (!settings || !Number(settings.show_floating) || path.startsWith("/checkout")) return null;
  const href = whatsappLink(settings);
  if (!href) return null;
  return (
    <a className="wa-float" href={href} target="_blank" rel="noopener noreferrer" aria-label={settings.button_label || "Chat on WhatsApp"}>
      <WhatsAppIcon />
      <span className="wa-float-text">
        <b>{settings.button_label || "Chat on WhatsApp"}</b>
        {settings.hours ? <small>{settings.hours}</small> : null}
      </span>
    </a>
  );
}

export function WhatsAppProductButton({ product }) {
  const settings = useWhatsApp();
  const [url, setUrl] = useState("");
  useEffect(() => { setUrl(window.location.href); }, []);
  if (!settings || !Number(settings.show_on_product)) return null;
  const text = fillTemplate(settings.product_message || "Hi Kidlo, I want to order {product}", {
    product: product.name,
    price: `PKR ${Number(product.price).toLocaleString("en-PK")}`,
    url,
  });
  const href = whatsappLink(settings, text);
  if (!href) return null;
  return (
    <a className="btn btn-whatsapp" href={href} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon /> Order on WhatsApp
    </a>
  );
}

export function WhatsAppIcon() {
  return (
    <svg className="wa-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2.1 7L3.5 29l6.4-1.6c2 1.1 4.1 1.6 6.1 1.6 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-3.8 1 1-3.7-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7C5.4 10 10.2 5.3 16 5.3S26.6 10 26.6 15.8 21.8 26.4 16 26.4zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2s0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.3 3.4c.2.2 2.3 3.5 5.6 4.9 2.8 1.1 3.3.9 3.9.8.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5c-.1-.2-.3-.3-.7-.5z" />
    </svg>
  );
}
