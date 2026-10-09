"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function ReviewsAdmin() {
  return <ResourceManager table="reviews" title="Reviews" description="Moderate customer reviews before they appear on product pages." columns={["city", "stars", "product_id", "enabled"]} identity={{ title: "author", subtitle: "text", emoji: "avatar" }} search={["author", "city", "text"]} filters={[{ key: "enabled", label: "Visibility", options: [["all", "All reviews"], ["1", "Published"], ["0", "Hidden"]] }]} blank={{ product_id: 1, author: "", city: "", role: "Parent", avatar: "😊", stars: 5, text: "", verified: 1, enabled: 1 }} />;
}
