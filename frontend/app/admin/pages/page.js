"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function PagesAdmin() {
  return (
    <ResourceManager
      table="pages"
      title="Content pages"
      columns={["title", "slug", "group_name", "enabled"]}
      blank={{ slug: "", title: "", group_name: "support", excerpt: "", content: "<p></p>", emoji: "📄", enabled: 1, sort_order: 20 }}
    />
  );
}
