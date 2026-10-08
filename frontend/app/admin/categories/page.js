"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

const blank = {
  slug: "", name: "", emoji: "🎁", blurb: "", color: "cat-a", count_label: "", parent_slug: "",
  group_name: "shop", nav_group: "shop", filter_tag: "", sort_order: 30, show_on_home: 0,
  show_in_footer: 1, show_in_nav: 1, virtual: "", virtual_value: "", active: 1,
};

export default function CategoriesAdmin() {
  return <ResourceManager table="categories" title="Categories" columns={["id", "name", "slug", "nav_group", "active"]} blank={blank} />;
}
