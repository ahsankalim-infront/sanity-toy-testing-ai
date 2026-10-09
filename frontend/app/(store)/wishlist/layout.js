import { seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/wishlist");

export default function WishlistLayout({ children }) {
  return children;
}
