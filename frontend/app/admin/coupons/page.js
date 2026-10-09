"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function CouponsAdmin() {
  return <ResourceManager table="coupons" title="Coupons" description="Create checkout discounts and set the minimum order for each code." columns={["type", "value", "min_order", "active"]} identity={{ title: "code", subtitle: "description" }} search={["code", "description"]} filters={[{ key: "active", label: "Status", options: [["all", "All coupons"], ["1", "Active"], ["0", "Inactive"]] }]} blank={{ code: "", type: "percent", value: 10, min_order: 1000, active: 1, description: "" }} />;
}
