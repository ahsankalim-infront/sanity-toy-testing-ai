"use client";

import SectionSettings from "../../../components/admin/SectionSettings";
import { WhatsAppIcon, fillTemplate, whatsappLink } from "../../../components/WhatsApp";

const FIELDS = [
  { key: "number", label: "WhatsApp number", placeholder: "923001234567", help: "International format with country code and no plus sign, spaces, or leading zero. Example: 923001234567." },
  { key: "button_label", label: "Button text", placeholder: "Chat on WhatsApp" },
  { key: "hours", label: "Reply hours", placeholder: "Mon–Sat, 9am–9pm PKT" },
  { key: "greeting", label: "Default message", type: "textarea", wide: true, help: "Pre-filled when a customer taps the floating button or the homepage banner." },
  { key: "product_message", label: "Product page message", type: "textarea", wide: true, help: "Use {product}, {price}, and {url}. They are replaced with the toy the customer is viewing." },
  { key: "banner_label", label: "Homepage banner label" },
  { key: "banner_title", label: "Homepage banner title" },
  { key: "banner_text", label: "Homepage banner text", type: "textarea", wide: true },
  { key: "show_floating", label: "Show the floating chat button on every store page", type: "toggle" },
  { key: "show_on_product", label: "Show “Order on WhatsApp” on product pages", type: "toggle" },
];

export default function WhatsAppAdmin() {
  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>WhatsApp</h1>
          <p className="muted" style={{ maxWidth: 760 }}>Control the floating chat button, the homepage WhatsApp banner, and the product page order button. Turn it off to hide all of them.</p>
        </div>
      </div>
      <SectionSettings sectionKey="whatsapp" title="WhatsApp chat settings" fields={FIELDS} enabledLabel="WhatsApp on storefront">
        {(draft) => {
          const href = whatsappLink(draft.payload);
          const sample = fillTemplate(draft.payload.product_message, { product: "Rainbow Unicorn Plush 50cm", price: "PKR 2,199", url: "https://kidlo.pk/product/rainbow-unicorn-plush-50cm" });
          return (
            <div className="wa-preview">
              <div>
                <small>Product message preview</small>
                <p>{sample || "No product message set."}</p>
              </div>
              {href ? <a className="btn btn-whatsapp" href={href} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Test the chat link</a> : <p className="checkout-note bad">Add a number to enable WhatsApp.</p>}
            </div>
          );
        }}
      </SectionSettings>
    </>
  );
}
