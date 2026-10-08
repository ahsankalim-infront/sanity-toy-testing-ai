import Link from "next/link";
import { notFound } from "next/navigation";
import InquiryForm from "../../../../components/InquiryForm";
import { api } from "../../../../lib/format";

export const dynamic = "force-dynamic";

const FORMS = {
  contact: "contact",
  careers: "careers",
  wholesale: "wholesale",
  "bulk-orders": "bulk",
  "gift-cards": "gift-card",
};

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
      <div className="page-hero">
        <div className="crumb"><Link href="/">Home</Link> / {page.title}</div>
        <h1>{page.emoji} {page.title}</h1>
        <p className="sec-sub">{page.excerpt}</p>
      </div>
      <div className={`page-body ${FORMS[page.slug] ? "split" : ""}`}>
        <article className="prose form-card" dangerouslySetInnerHTML={{ __html: page.content }} />
        {FORMS[page.slug] ? <InquiryForm type={FORMS[page.slug]} /> : null}
      </div>
    </>
  );
}
