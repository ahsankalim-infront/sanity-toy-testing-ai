import { notFound } from "next/navigation";
import ProductView from "../../../../components/ProductView";
import { api } from "../../../../lib/format";
import { SeoJsonLd, seoMetadata } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  let fallback = {};
  try {
    const { product } = await api(`/api/products/${params.slug}`);
    fallback = { title: `${product.name} | Kidlo Toys`, description: product.description };
  } catch { /* SEO helper supplies the store default */ }
  return seoMetadata(`/product/${params.slug}`, fallback);
}

export default async function ProductPage({ params }) {
  let initial = null;
  try {
    initial = await api(`/api/products/${params.slug}`);
  } catch (err) {
    if (/not found/i.test(err.message)) notFound();
  }
  const product = initial?.product;
  return (
    <>
      <SeoJsonLd
        path={`/product/${params.slug}`}
        fallback={product ? {
          type: "Product",
          title: product.name,
          description: product.description,
          extra: {
            sku: product.sku,
            brand: { "@type": "Brand", name: product.brand },
            offers: { "@type": "Offer", priceCurrency: "PKR", price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
          },
        } : undefined}
      />
      <ProductView slug={params.slug} initial={initial} />
    </>
  );
}
