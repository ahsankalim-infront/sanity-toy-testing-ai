"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function PagesAdmin() {
  return (
    <ResourceManager
      table="pages"
      title="Content pages"
      description="Edit support and company pages shown in the storefront footer."
      columns={["group_name", "sort_order", "enabled"]}
      identity={{ title: "title", subtitle: "slug", emoji: "emoji" }}
      search={["title", "slug", "excerpt"]}
      filters={[{ key: "group_name", label: "Group", options: [["all", "All groups"], ["support", "Support"], ["company", "Company"]] }, { key: "enabled", label: "Visibility", options: [["all", "All pages"], ["1", "Published"], ["0", "Hidden"]] }]}
      blank={{ slug: "", title: "", group_name: "support", excerpt: "", content: "<p></p>", emoji: "📄", enabled: 1, sort_order: 20 }}
    />
  );
}
