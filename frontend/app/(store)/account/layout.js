import { seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/account");

export default function AccountLayout({ children }) {
  return children;
}
