import { api } from "../lib/format";

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return (configured || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/+$/, "");
}

export default async function sitemap() {
  try {
    const { entries } = await api("/api/seo-index");
    return entries.map((entry) => ({
      url: `${baseUrl()}${entry.path === "/" ? "" : entry.path}`,
      lastModified: entry.updated_at ? new Date(entry.updated_at) : new Date(),
      changeFrequency: entry.path === "/" ? "daily" : "weekly",
      priority: entry.path === "/" ? 1 : entry.path.startsWith("/product/") ? 0.8 : 0.7,
    }));
  } catch {
    return [{ url: baseUrl(), changeFrequency: "daily", priority: 1 }];
  }
}
