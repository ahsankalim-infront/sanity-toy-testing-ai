import { seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/cart");

export default function CartLayout({ children }) {
  return children;
}
