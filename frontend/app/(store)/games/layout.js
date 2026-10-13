import { SeoJsonLd, seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/games");

export default function GamesLayout({ children }) {
  return <><SeoJsonLd path="/games" />{children}</>;
}
