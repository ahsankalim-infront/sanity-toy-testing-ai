import ShopBrowser from "../../../../components/ShopBrowser";
import { catalogQuery } from "../../../../lib/catalog";
import { api } from "../../../../lib/format";

export const dynamic = "force-dynamic";

export default async function ShopPage({ params, searchParams }) {
  const query = catalogQuery(params.slug, searchParams || {});
  let initial = null;
  try {
    initial = await api(`/api/catalog?${query}`);
  } catch { /* the browser retries and shows the error */ }
  return <ShopBrowser slug={params.slug} initial={initial} initialKey={query} />;
}
