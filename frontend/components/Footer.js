import Link from "next/link";

export default function Footer({ shell }) {
  const sections = Object.fromEntries((shell?.sections || []).map((row) => [row.section_key, row.payload]));
  const footer = sections.footer || {};
  const preferred = ["boys-toys", "girls-toys", "baby-infant", "stem", "outdoor", "arts-crafts", "new-arrivals", "sale"];
  const categories = (shell?.categories || [])
    .filter((row) => row.show_in_footer)
    .sort((a, b) => (preferred.indexOf(a.slug) + 1 || 99) - (preferred.indexOf(b.slug) + 1 || 99));
  return (
    <footer>
      <div className="footer-top">
        <div className="fb-logo">
          <img src="/logo.png" alt="Kidlo" />
          <p>{footer.blurb}</p>
          <div className="fb-social">
            {(footer.social || []).map((item) => (
              <a key={item.icon} className="soc-btn" style={{ background: item.bg }} href={item.href} target="_blank" rel="noreferrer">{item.icon}</a>
            ))}
          </div>
        </div>
        <div>
          <div className="fc-title">Shop</div>
          <ul className="fc-list">
            {categories.map((row) => (
              <li key={row.slug}><Link href={`/shop/${row.slug}`}>{row.name}</Link></li>
            ))}
          </ul>
        </div>
        <FooterColumn title="Support" links={[
          ["/track", "Track My Order"],
          ["/p/returns", "Returns & Refunds"],
          ["/p/faqs", "FAQs"],
          ["/p/shipping", "Shipping Info"],
          ["/p/age-guide", "Size & Age Guide"],
          ["/p/gift-cards", "Gift Cards"],
          ["/p/bulk-orders", "Bulk Orders"],
          ["/p/contact", "Contact Us"],
        ]} />
        <FooterColumn title="Company" links={[
          ["/p/about", "About Kidlo"],
          ["/p/our-story", "Our Story"],
          ["/blog", "Blog & Tips"],
          ["/p/careers", "Careers"],
          ["/p/press", "Press Kit"],
          ["/p/privacy", "Privacy Policy"],
          ["/p/terms", "Terms of Use"],
          ["/p/wholesale", "Wholesale"],
        ]} />
        <div>
          <div className="fc-title">Contact Us</div>
          <div className="contact-item"><div className="ci-icon">📍</div><div className="ci-text"><strong>Our Office</strong>{footer.address}</div></div>
          <div className="contact-item"><div className="ci-icon">📞</div><div className="ci-text"><strong>Phone / WhatsApp</strong>{footer.phone}</div></div>
          <div className="contact-item"><div className="ci-icon">📧</div><div className="ci-text"><strong>Email</strong>{footer.email}</div></div>
          <div className="contact-item"><div className="ci-icon">🕐</div><div className="ci-text"><strong>Hours</strong>{footer.hours}</div></div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{footer.copyright}</p>
        <div className="footer-badges">
          <span className="fbadge">🛡️ SSL Secure</span>
          <span className="fbadge">✅ COD Ready</span>
          <Link href="/admin/login" className="fbadge">Store admin</Link>
        </div>
        <div className="pay-icons">💳 🏦 📱 💵</div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <div className="fc-title">{title}</div>
      <ul className="fc-list">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href}>{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
