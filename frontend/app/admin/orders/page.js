"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function OrdersAdmin() {
  return (
    <ResourceManager
      table="orders"
      title="Orders"
      description="Review customers, delivery cities, payment methods, and fulfilment status."
      columns={["city", "status", "total", "payment_method"]}
      identity={{ title: "order_no", subtitle: "customer_name" }}
      search={["order_no", "customer_name", "phone", "email", "city"]}
      filters={[{ key: "status", label: "Status", options: [["all", "All statuses"], ["Placed", "Placed"], ["Processing", "Processing"], ["Shipped", "Shipped"], ["Delivered", "Delivered"], ["Cancelled", "Cancelled"]] }]}
      blank={{ order_no: "", customer_name: "", email: "", phone: "", address: "", city: "", payment_method: "cod", status: "Placed", subtotal: 0, shipping: 0, discount: 0, total: 0, coupon_code: "", notes: "" }}
    />
  );
}
