import { notFound } from "next/navigation";
import ProductView from "../../../../components/ProductView";
import { api } from "../../../../lib/format";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  let initial = null;
  try {
    initial = await api(`/api/products/${params.slug}`);
  } catch (err) {
    if (/not found/i.test(err.message)) notFound();
  }
  return <ProductView slug={params.slug} initial={initial} />;
}
