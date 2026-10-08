"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function ReviewsAdmin() {
  return <ResourceManager table="reviews" title="Reviews" columns={["author", "city", "stars", "product_id", "enabled"]} blank={{ product_id: 1, author: "", city: "", role: "Parent", avatar: "😊", stars: 5, text: "", verified: 1, enabled: 1 }} />;
}
