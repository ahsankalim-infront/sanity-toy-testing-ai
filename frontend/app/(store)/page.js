import HomePage from "../../components/HomePage";
import { api } from "../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/");

export default async function Page() {
  try {
    const data = await api("/api/home");
    return (
      <>
        <SeoJsonLd path="/" fallback={{ type: "WebSite", title: "Kidlo Toys Pakistan", description: "Toys for every age with nationwide delivery." }} />
        <HomePage data={data} />
      </>
    );
  } catch (err) {
    return <section className="page-body"><div className="empty"><div className="big">🧸</div><h2 className="sec-head">Kidlo is starting up</h2><p className="sec-sub">{err.message}</p></div></section>;
  }
}
