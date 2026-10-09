"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

const blank = {
  path: "/",
  title: "",
  description: "",
  keywords: "",
  canonical: "",
  image: "/logo.png",
  robots: "index,follow",
  og_type: "website",
  schema_json: {},
  enabled: 1,
};

export default function SeoAdmin() {
  return (
    <ResourceManager
      table="seo_entries"
      title="SEO"
      description="Manage browser titles, search descriptions, keywords, canonical URLs, social sharing images, indexing rules, and optional JSON-LD schema for every storefront route."
      columns={["robots", "og_type", "enabled"]}
      identity={{ title: "title", subtitle: "path" }}
      search={["path", "title", "description", "keywords"]}
      filters={[{ key: "enabled", label: "Status", options: [["all", "All entries"], ["1", "Active"], ["0", "Disabled"]] }]}
      blank={blank}
    />
  );
}
