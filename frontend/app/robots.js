function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return (configured || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/+$/, "");
}

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/account", "/cart", "/checkout", "/wishlist"] },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl(),
  };
}
