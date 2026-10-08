import { Suspense } from "react";
import ShopBrowser from "../../../components/ShopBrowser";

export default function SearchPage() {
  return (
    <Suspense fallback={<section className="page-body">Searching…</section>}>
      <ShopBrowser />
    </Suspense>
  );
}
