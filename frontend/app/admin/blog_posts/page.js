"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function BlogAdmin() {
  return (
    <ResourceManager
      table="blog_posts"
      title="Blog"
      description="Publish parent guides and control which articles appear on the blog."
      columns={["category", "author", "published_at", "enabled"]}
      identity={{ title: "title", subtitle: "slug", emoji: "emoji" }}
      search={["title", "category", "author", "excerpt"]}
      filters={[{ key: "enabled", label: "Visibility", options: [["all", "All articles"], ["1", "Published"], ["0", "Hidden"]] }]}
      blank={{ slug: "", title: "", category: "Tips", excerpt: "", content: "<p></p>", emoji: "📝", image_url: "", image_alt: "", gradient: "linear-gradient(135deg,#FFF3E0,#FFE8F5)", author: "Kidlo Team", read_time: "4 min read", published_at: "2026-01-01", enabled: 1 }}
    />
  );
}
