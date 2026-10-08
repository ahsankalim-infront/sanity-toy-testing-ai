import { Suspense } from "react";
import ShopBrowser from "../../../../components/ShopBrowser";

export default function ShopPage({ params }) {
  return (
    <Suspense fallback={<section className="page-body">Loading toys…</section>}>
      <ShopBrowser slug={params.slug} />
    </Suspense>
  );
}
