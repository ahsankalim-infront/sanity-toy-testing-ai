import { api } from "./format";

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const value = configured || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return value.replace(/\/+$/, "");
}

function absolute(value, base = siteUrl()) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function getSeoEntry(path) {
  try {
    return (await api(`/api/seo?path=${encodeURIComponent(path)}`)).entry;
  } catch {
    return null;
  }
}

export async function seoMetadata(path, fallback = {}) {
  const entry = await getSeoEntry(path);
  const title = entry?.title || fallback.title || "Kidlo Toys – Play. Discover. Grow.";
  const description = entry?.description || fallback.description || "Shop trusted toys for children across Pakistan.";
  const canonicalPath = entry?.canonical || path;
  const canonical = absolute(canonicalPath);
  const image = absolute(entry?.image || fallback.image || "/logo.png");
  const robotText = entry?.robots || fallback.robots || "index,follow";
  const robots = {
    index: !/\bnoindex\b/i.test(robotText),
    follow: !/\bnofollow\b/i.test(robotText),
  };
  const keywords = String(entry?.keywords || fallback.keywords || "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords,
    robots,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Kidlo Toys",
      type: entry?.og_type === "article" ? "article" : "website",
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export async function SeoJsonLd({ path, fallback }) {
  const entry = await getSeoEntry(path);
  const custom = entry?.schema_json;
  const hasCustom = custom && typeof custom === "object" && Object.keys(custom).length;
  const schema = hasCustom ? custom : {
    "@context": "https://schema.org",
    "@type": fallback?.type || (entry?.og_type === "article" ? "Article" : "WebPage"),
    name: entry?.title || fallback?.title,
    description: entry?.description || fallback?.description,
    url: absolute(entry?.canonical || path),
    ...(fallback?.extra || {}),
  };
  if (!schema.name) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />;
}
