"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

const blank = {
  slug: "", name: "", emoji: "🧸", category_slug: "boys-toys", gender: "all", age_min: 3, age_max: 8,
  age_label: "All · 3–8 yrs", price: 1999, compare_price: 0, badge: "", rating: 5, review_count: 0,
  stock: 10, sold: 0, description: "", gradient: "linear-gradient(135deg,#FFF3E0,#FFE0C0)", brand: "Kidlo",
  sku: "", tags: "", featured: 0, is_deal: 0, active: 1,
};

export default function ProductsAdmin() {
  return <ResourceManager table="products" title="Products" columns={["id", "name", "price", "stock", "category_slug", "active"]} blank={blank} />;
}
