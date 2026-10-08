/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  async rewrites() {
    // On Vercel, vercel.json sends /api to the backend service. This rewrite is only
    // for local `next dev`, where that route table is not running. The binding URL
    // is not available while this file is evaluated.
    if (process.env.VERCEL) return [];
    return [{ source: "/api/:path*", destination: "http://127.0.0.1:4000/api/:path*" }];
  },
};

module.exports = nextConfig;
