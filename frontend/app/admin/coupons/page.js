"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function CouponsAdmin() {
  return <ResourceManager table="coupons" title="Coupons" columns={["code", "type", "value", "min_order", "active"]} blank={{ code: "", type: "percent", value: 10, min_order: 1000, active: 1, description: "" }} />;
}
