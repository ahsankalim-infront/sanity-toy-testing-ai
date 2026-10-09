import { seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/checkout");

export default function CheckoutLayout({ children }) {
  return children;
}
