import { SeoJsonLd, seoMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const generateMetadata = () => seoMetadata("/track");

export default function TrackLayout({ children }) {
  return <><SeoJsonLd path="/track" />{children}</>;
}
