import ProductView from "../../../../components/ProductView";

export default function ProductPage({ params }) {
  return <ProductView slug={params.slug} />;
}
