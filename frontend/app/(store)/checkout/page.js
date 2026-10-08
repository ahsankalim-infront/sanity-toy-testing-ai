"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, pkr } from "../../../lib/format";
import { useCart } from "../../../context/CartContext";

const EMPTY = { customer_name: "", email: "", phone: "", address: "", city: "Lahore", payment_method: "cod", coupon_code: "", notes: "" };

export default function CheckoutPage() {
  const { cart, subtotal, clear } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [rules, setRules] = useState({ free_shipping_over: 2000, shipping_fee: 199 });
  const shipping = subtotal === 0 || Math.max(0, subtotal - discount) >= Number(rules.free_shipping_over) ? 0 : Number(rules.shipping_fee);

  useEffect(() => {
    api("/api/shell").then((shell) => {
      const commerce = (shell.sections || []).find((row) => row.section_key === "commerce");
      if (commerce?.payload) setRules(commerce.payload);
    }).catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem("kidlo_customer_profile") || "null");
      if (saved) {
        setForm((current) => ({
          ...current,
          customer_name: saved.name || current.customer_name,
          email: saved.email || current.email,
          phone: saved.phone || current.phone,
        }));
      }
    } catch { /* guest checkout */ }
  }, []);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function applyCode() {
    try {
      const result = await api("/api/coupons/validate", { method: "POST", body: { code: form.coupon_code, subtotal } });
      setDiscount(result.discount);
      setMessage(result.description);
    } catch (err) {
      setDiscount(0);
      setMessage(err.message);
    }
  }

  async function place(event) {
    event.preventDefault();
    try {
      const result = await api("/api/orders", {
        method: "POST",
        body: { ...form, items: cart.map((item) => ({ product_id: item.id, qty: item.qty })) },
      });
      setOrder(result.order);
      clear();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (order) {
    return (
      <div className="page-body">
        <div className="form-card ok-banner">
          <h1 className="sec-head">Order {order.order_no} is placed</h1>
          <p>We will call {order.phone} before delivery in {order.city}. Pay {pkr(order.total)} by {order.payment_method.toUpperCase()}.</p>
          <Link className="btn btn-orange" href="/track">Track this order</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero"><div className="crumb"><Link href="/cart">Cart</Link> / Checkout</div><h1>Checkout</h1></div>
      <div className="page-body">
        {!cart.length ? <p>Your cart is empty. <Link href="/shop/sale">See today's deals</Link>.</p> : (
          <form className="cart-layout" onSubmit={place}>
            <div className="form-card">
              <div className="form-grid">
                <div className="field"><label>Full name</label><input required value={form.customer_name} onChange={(event) => set("customer_name", event.target.value)} /></div>
                <div className="field"><label>Phone</label><input required value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="03xxxxxxxxx" /></div>
              </div>
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></div>
              <div className="field"><label>Address</label><input required value={form.address} onChange={(event) => set("address", event.target.value)} /></div>
              <div className="form-grid">
                <div className="field"><label>City</label><input required value={form.city} onChange={(event) => set("city", event.target.value)} /></div>
                <div className="field"><label>Payment</label>
                  <select value={form.payment_method} onChange={(event) => set("payment_method", event.target.value)}>
                    <option value="cod">Cash on delivery</option>
                    <option value="card">Card</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="bank">Bank transfer</option>
                  </select>
                </div>
              </div>
              <div className="field"><label>Gift note</label><textarea rows={3} value={form.notes} onChange={(event) => set("notes", event.target.value)} /></div>
            </div>
            <aside className="form-card">
              {cart.map((item) => <div className="summary-line" key={item.id}><span>{item.emoji} {item.name} × {item.qty}</span><span>{pkr(item.price * item.qty)}</span></div>)}
              <div className="field"><label>Promo code</label>
                <div className="coupon-row" style={{ display: "flex", gap: 8 }}>
                  <input value={form.coupon_code} onChange={(event) => set("coupon_code", event.target.value)} placeholder="KIDLO50" />
                  <button type="button" className="btn btn-outline" onClick={applyCode}>Apply</button>
                </div>
              </div>
              <div className="summary-line"><span>Discount</span><span>-{pkr(discount)}</span></div>
              <div className="summary-line"><span>Delivery</span><span>{shipping ? pkr(shipping) : "Free"}</span></div>
              <div className="summary-line total"><span>Total</span><span>{pkr(Math.max(0, subtotal - discount + shipping))}</span></div>
              {message ? <p className="muted">{message}</p> : null}
              <button className="btn btn-orange" style={{ width: "100%", justifyContent: "center" }} type="submit">Place order</button>
            </aside>
          </form>
        )}
      </div>
    </>
  );
}
