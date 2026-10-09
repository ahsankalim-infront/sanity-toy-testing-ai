import Link from "next/link";
import { notFound } from "next/navigation";
import InquiryForm from "../../../../components/InquiryForm";
import { api } from "../../../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

const FORMS = {
  contact: "contact",
  careers: "careers",
  wholesale: "wholesale",
  "bulk-orders": "bulk",
  "gift-cards": "gift-card",
};

const NAV = {
  support: [
    ["returns", "Returns & Refunds"],
    ["faqs", "FAQs"],
    ["shipping", "Shipping Info"],
    ["age-guide", "Size & Age Guide"],
    ["gift-cards", "Gift Cards"],
    ["bulk-orders", "Bulk Orders"],
    ["contact", "Contact Us"],
  ],
  company: [
    ["about", "About Kidlo"],
    ["our-story", "Our Story"],
    ["blog", "Blog & Tips"],
    ["careers", "Careers"],
    ["press", "Press Kit"],
    ["privacy", "Privacy Policy"],
    ["terms", "Terms of Use"],
    ["wholesale", "Wholesale"],
  ],
};

export async function generateMetadata({ params }) {
  return seoMetadata(`/p/${params.slug}`);
}

export default async function CmsPage({ params }) {
  let page;
  try {
    const data = await api(`/api/pages/${params.slug}`);
    page = data.page;
  } catch {
    notFound();
  }
  return (
    <>
      <SeoJsonLd path={`/p/${page.slug}`} fallback={{ title: page.title, description: page.excerpt }} />
      <div className={`page-hero cms-hero cms-${page.group_name}`}>
        <div className="cms-hero-inner">
          <div>
            <div className="crumb"><Link href="/">Home</Link> / <span>{page.group_name === "support" ? "Help Centre" : "Company"}</span> / {page.title}</div>
            <span className="cms-kicker">{page.group_name === "support" ? "Kidlo Help Centre" : "Inside Kidlo"}</span>
            <h1>{page.title}</h1>
            <p>{page.excerpt}</p>
          </div>
          <div className="cms-hero-art" aria-hidden="true"><span>{page.emoji}</span></div>
        </div>
      </div>
      <div className="page-body cms-shell">
        <aside className="cms-side">
          <strong>{page.group_name === "support" ? "Help & support" : "Company"}</strong>
          <nav>
            {(NAV[page.group_name] || []).map(([slug, label]) => (
              <Link key={slug} className={slug === page.slug ? "active" : ""} href={slug === "blog" ? "/blog" : `/p/${slug}`}>
                {label}<span>›</span>
              </Link>
            ))}
          </nav>
          <div className="cms-help">
            <span>Need a quick answer?</span>
            <b>+92 300 1234567</b>
            <small>Mon–Sat · 9am–9pm PKT</small>
          </div>
        </aside>
        <main className="cms-main">
          <article className="prose cms-article" dangerouslySetInnerHTML={{ __html: page.content }} />
          {FORMS[page.slug] ? (
            <section className="cms-form-wrap">
              <div className="cms-form-head">
                <span>Send us a message</span>
                <h2>How can we help?</h2>
                <p>Share the important details and our team will reply within one working day.</p>
              </div>
              <InquiryForm type={FORMS[page.slug]} />
            </section>
          ) : null}
          <div className="cms-bottom-help">
            <div><span>Still have a question?</span><strong>Our support team is ready to help.</strong></div>
            <Link className="btn btn-orange" href="/p/contact">Contact Kidlo</Link>
          </div>
        </main>
      </div>
    </>
  );
}
