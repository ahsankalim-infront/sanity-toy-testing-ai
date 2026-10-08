"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function OrdersAdmin() {
  return (
    <ResourceManager
      table="orders"
      title="Orders"
      columns={["order_no", "customer_name", "city", "status", "total", "payment_method"]}
      blank={{ order_no: "", customer_name: "", email: "", phone: "", address: "", city: "", payment_method: "cod", status: "Placed", subtotal: 0, shipping: 0, discount: 0, total: 0, coupon_code: "", notes: "" }}
    />
  );
}
