import ShopBrowser from "../../../../components/ShopBrowser";
import { catalogQuery } from "../../../../lib/catalog";
import { api } from "../../../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return seoMetadata(`/shop/${params.slug}`);
}

export default async function ShopPage({ params, searchParams }) {
  const query = catalogQuery(params.slug, searchParams || {});
  let initial = null;
  try {
    initial = await api(`/api/catalog?${query}`);
  } catch { /* the browser retries and shows the error */ }
  return (
    <>
      <SeoJsonLd
        path={`/shop/${params.slug}`}
        fallback={{ title: initial?.category?.name || "Shop Toys", description: initial?.category?.blurb }}
      />
      <ShopBrowser slug={params.slug} initial={initial} initialKey={query} />
    </>
  );
}
