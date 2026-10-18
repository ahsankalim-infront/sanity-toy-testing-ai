"use client";

import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import ResourceManager from "../../../components/admin/ResourceManager";
import { api, pkr } from "../../../lib/format";

export default function OrdersAdmin() {
  const pending = useAdminRows("orders");
  const proofs = pending.rows.filter((row) => row.payment_status === "submitted");

  async function decide(row, status) {
    await api(`/api/admin/orders/${row.id}/payment`, { method: "POST", headers: adminHeaders(), body: { status } });
    await pending.reload();
  }

  return (
    <>
      {proofs.length ? (
        <section className="form-card" style={{ marginBottom: 22 }}>
          <h2 className="sec-head" style={{ fontSize: 24 }}>Payment receipts to review</h2>
          <p className="muted">A customer paid by EasyPaisa, JazzCash, or bank transfer. Check the receipt, then confirm or reject it.</p>
          <div className="admin-record-list" style={{ marginTop: 14 }}>
            {proofs.map((row) => (
              <article className="admin-record" key={row.id}>
                <div className="admin-record-mark">{row.payment_proof_url ? <img src={row.payment_proof_url} alt="" /> : "🧾"}</div>
                <div className="admin-record-main">
                  <strong>{row.order_no} · {pkr(row.total)}</strong>
                  <span>{row.customer_name} · {row.payment_method} · {row.payment_account_label || "Account"}{row.payment_txn ? ` · ${row.payment_txn}` : ""}</span>
                </div>
                <div className="row-actions">
                  {row.payment_proof_url ? <a className="btn btn-outline" href={row.payment_proof_url} target="_blank" rel="noreferrer">Open receipt</a> : null}
                  <button className="btn btn-orange" type="button" onClick={() => decide(row, "verified")}>Payment received</button>
                  <button className="text-btn" type="button" onClick={() => decide(row, "rejected")}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <ResourceManager
        table="orders"
        title="Orders"
        description="Review customers, delivery cities, payment methods, and fulfilment status. Wallet and bank orders stay on Payment pending until you confirm the receipt. Cancelling an order returns any Kidlo Coins used on it."
        columns={["city", "status", "total", "payment_method"]}
        identity={{ title: "order_no", subtitle: "customer_name" }}
        search={["order_no", "customer_name", "phone", "email", "city", "payment_txn"]}
        filters={[{ key: "status", label: "Status", options: [["all", "All statuses"], ["Payment pending", "Payment pending"], ["Placed", "Placed"], ["Processing", "Processing"], ["Shipped", "Shipped"], ["Delivered", "Delivered"], ["Cancelled", "Cancelled"]] }]}
        blank={{ order_no: "", customer_name: "", email: "", phone: "", address: "", city: "", payment_method: "cod", status: "Placed", payment_status: "", payment_account_label: "", payment_txn: "", payment_proof_url: "", payment_note: "", subtotal: 0, shipping: 0, discount: 0, total: 0, coupon_code: "", notes: "" }}
      />
    </>
  );
}
