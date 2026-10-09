"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

const blank = {
  slug: "", name: "", emoji: "🎁", image_url: "", image_alt: "", blurb: "", color: "cat-a", count_label: "", parent_slug: "",
  group_name: "shop", nav_group: "shop", filter_tag: "", sort_order: 30, show_on_home: 0,
  show_in_footer: 1, show_in_nav: 1, virtual: "", virtual_value: "", active: 1,
};

export default function CategoriesAdmin() {
  return <ResourceManager table="categories" title="Categories" description="Control shop navigation, homepage groups, and category visibility." columns={["nav_group", "parent_slug", "sort_order", "active"]} identity={{ title: "name", subtitle: "slug", emoji: "emoji" }} search={["name", "slug", "nav_group"]} filters={[{ key: "active", label: "Visibility", options: [["all", "All categories"], ["1", "Active"], ["0", "Hidden"]] }]} blank={blank} />;
}
