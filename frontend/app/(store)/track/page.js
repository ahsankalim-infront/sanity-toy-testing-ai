"use client";

import Link from "next/link";
import { useState } from "react";
import { api, pkr } from "../../../lib/format";
import ProductMedia from "../../../components/ProductMedia";

const STEPS = ["Placed", "Processing", "Shipped", "Delivered"];

export default function TrackPage() {
  const [form, setForm] = useState({ order_no: "KD1001", phone: "03001234567" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      setResult(await api("/api/orders/track", { method: "POST", body: form }));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-hero track-hero">
        <div className="crumb"><Link href="/">Home</Link> / Help Centre / Track My Order</div>
        <span className="cms-kicker">Delivery updates</span>
        <h1>Track My Order</h1>
        <p>See your order status, delivery details, and items in one place.</p>
      </div>
      <div className="page-body track-shell">
        <form className="form-card track-form" onSubmit={submit}>
          <div className="track-form-head"><span>📍</span><div><h2>Find your parcel</h2><p>Enter the details used when placing the order.</p></div></div>
          <div className="field"><label htmlFor="track-order">Order number</label><input id="track-order" required autoCapitalize="characters" placeholder="e.g. KD1001" value={form.order_no} onChange={(event) => setForm({ ...form, order_no: event.target.value.toUpperCase() })} /></div>
          <div className="field"><label htmlFor="track-phone">Phone number</label><input id="track-phone" required inputMode="tel" autoComplete="tel" placeholder="03xx xxx xxxx" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <button className="btn btn-orange track-button" type="submit">Track my order <span>→</span></button>
          {error ? <p className="track-error">{error}</p> : null}
          <div className="track-demo"><span>Demo details</span><button type="button" onClick={() => setForm({ order_no: "KD1001", phone: "03001234567" })}>KD1001 · 03001234567</button></div>
        </form>
        {result ? (
          <div className="form-card track-result">
            <div className="track-result-head"><div><span>Order {result.order.order_no}</span><h2>{statusCopy(result.order.status)}</h2></div><span className="pill">{result.order.status}</span></div>
            <div className="track-progress">
              {STEPS.map((step, index) => {
                const current = Math.max(0, STEPS.indexOf(result.order.status));
                return <div key={step} className={index <= current ? "done" : ""}><i>{index < current ? "✓" : index + 1}</i><span>{step}</span></div>;
              })}
            </div>
            <div className="track-info-grid">
              <div><span>Delivering to</span><strong>{result.order.customer_name}</strong><p>{result.order.address}, {result.order.city}</p></div>
              <div><span>Payment</span><strong>{String(result.order.payment_method).toUpperCase()}</strong><p>Total {pkr(result.order.total)}</p></div>
            </div>
            <div className="track-items">
              <h3>Items in this order</h3>
              {result.items.map((item) => <div className="summary-line" key={item.id}><span><i><ProductMedia product={item} /></i> {item.name} × {item.qty}</span><strong>{pkr(item.price * item.qty)}</strong></div>)}
            </div>
          </div>
        ) : <div className="track-assurance"><span>📦</span><h2>Your delivery, clearly tracked</h2><p>Updates appear as soon as your order is confirmed, packed, and handed to the courier.</p><ul><li>Nationwide delivery in 2–5 working days</li><li>Courier calls before delivery</li><li>Support available Monday to Saturday</li></ul><Link href="/p/contact">Need help with an order? Contact us →</Link></div>}
      </div>
    </>
  );
}

function statusCopy(status) {
  return {
    Placed: "We have received your order",
    Processing: "Your toys are being packed",
    Shipped: "Your parcel is on the way",
    Delivered: "Your order has been delivered",
    Cancelled: "This order was cancelled",
  }[status] || `Order status: ${status}`;
}
