import ShopBrowser from "../../../components/ShopBrowser";
import { catalogQuery } from "../../../lib/catalog";
import { api } from "../../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/search");

export default async function SearchPage({ searchParams }) {
  const query = catalogQuery("", searchParams || {});
  let initial = null;
  try {
    initial = await api(`/api/catalog?${query}`);
  } catch { /* the browser retries and shows the error */ }
  return (
    <>
      <SeoJsonLd path="/search" fallback={{ title: "Search Toys", description: "Find toys by age, interest, and price." }} />
      <ShopBrowser initial={initial} initialKey={query} />
    </>
  );
}
