"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function BlogAdmin() {
  return (
    <ResourceManager
      table="blog_posts"
      title="Blog"
      columns={["title", "category", "author", "enabled"]}
      blank={{ slug: "", title: "", category: "Tips", excerpt: "", content: "<p></p>", emoji: "📝", gradient: "linear-gradient(135deg,#FFF3E0,#FFE8F5)", author: "Kidlo Team", read_time: "4 min read", published_at: "2026-01-01", enabled: 1 }}
    />
  );
}
