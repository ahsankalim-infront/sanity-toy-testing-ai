"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, pkr } from "../../../lib/format";
import { useCart } from "../../../context/CartContext";
import { CityField, PhoneField } from "../../../components/PlaceFields";

const EMPTY = { customer_name: "", email: "", phone: "", address: "", city: "Lahore", country_code: "PK", payment_method: "cod", coupon_code: "", notes: "" };

const PAYMENTS = [
  { id: "cod", title: "Cash on delivery", text: "Pay the rider when the parcel arrives", icon: "💵" },
  { id: "card", title: "Card", text: "Visa or Mastercard", icon: "💳" },
  { id: "easypaisa", title: "EasyPaisa", text: "Pay from your wallet", icon: "📱" },
  { id: "jazzcash", title: "JazzCash", text: "Pay from your wallet", icon: "📲" },
  { id: "bank", title: "Bank transfer", text: "We share details after you place the order", icon: "🏦" },
];


export default function CheckoutPage() {
  const { cart, subtotal, clear, ready } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [order, setOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [rules, setRules] = useState({ free_shipping_over: 2000, shipping_fee: 199, cod_note: "" });
  const [places, setPlaces] = useState({ countries: [], cities: [] });
  const payable = Math.max(0, subtotal - discount);
  const freeOver = Number(rules.free_shipping_over) || 2000;
  const shipping = subtotal === 0 || payable >= freeOver ? 0 : Number(rules.shipping_fee);
  const total = payable + shipping;
  const untilFree = Math.max(0, freeOver - payable);

  useEffect(() => {
    api("/api/places").then(setPlaces).catch(() => {});
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
    setMessage("");
    try {
      const result = await api("/api/coupons/validate", { method: "POST", body: { code: form.coupon_code, subtotal } });
      setDiscount(result.discount);
      setMessageOk(true);
      setMessage(result.description);
    } catch (err) {
      setDiscount(0);
      setMessageOk(false);
      setMessage(err.message);
    }
  }

  async function place(event) {
    event.preventDefault();
    setPlacing(true);
    setMessage("");
    try {
      const result = await api("/api/orders", {
        method: "POST",
        body: { ...form, country_code: form.country_code, items: cart.map((item) => ({ product_id: item.id, qty: item.qty })) },
      });
      setOrder(result.order);
      clear();
    } catch (err) {
      setMessageOk(false);
      setMessage(err.message);
      setPlacing(false);
    }
  }

  if (order) return <OrderPlaced order={order} />;
  if (!ready) {
    return (
      <div className="page-body">
        <div className="checkout-grid">
          <div className="skeleton" style={{ height: 520 }} />
          <div className="skeleton" style={{ height: 360 }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero checkout-hero">
        <div className="crumb"><Link href="/">Home</Link> / <Link href="/cart">Cart</Link> / Checkout</div>
        <h1>Checkout</h1>
        <p className="sec-sub">Delivery across Pakistan. Cash on delivery, cards, and mobile wallets.</p>
        <ol className="checkout-steps">
          <li className="done"><Link href="/cart">Cart</Link></li>
          <li className="current">Delivery & payment</li>
          <li>Confirmation</li>
        </ol>
      </div>
      <div className="page-body">
        {!cart.length ? (
          <div className="checkout-empty form-card">
            <div className="big">🛍️</div>
            <h2 className="sec-head">Your cart is empty</h2>
            <p className="sec-sub">Add a toy first, then come back to enter the delivery address.</p>
            <Link className="btn btn-orange" href="/shop/sale">See today's deals</Link>
          </div>
        ) : (
          <form className="checkout-grid" onSubmit={place}>
            <div className="checkout-main">
              <section className="form-card">
                <header className="checkout-block-head">
                  <span>1</span>
                  <div>
                    <h2>Delivery details</h2>
                    <p>We call this number before the rider leaves.</p>
                  </div>
                </header>
                <div className="form-grid">
                  <div className="field"><label htmlFor="name">Full name</label><input id="name" required autoComplete="name" value={form.customer_name} onChange={(event) => set("customer_name", event.target.value)} placeholder="Ayesha Malik" /></div>
                  <PhoneField
                    countries={places.countries}
                    countryCode={form.country_code}
                    phone={form.phone}
                    onCountry={(code) => setForm((current) => ({ ...current, country_code: code, phone: "", city: "" }))}
                    onPhone={(phone) => set("phone", phone)}
                  />
                </div>
                <div className="field"><label htmlFor="email">Email <em>optional, for the receipt</em></label><input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="you@email.com" /></div>
                <div className="field"><label htmlFor="address">Street address</label><input id="address" required autoComplete="street-address" value={form.address} onChange={(event) => set("address", event.target.value)} placeholder="House, street, area" /></div>
                <CityField cities={places.cities} countryCode={form.country_code} city={form.city} onCity={(city) => set("city", city)} />
              </section>

              <section className="form-card">
                <header className="checkout-block-head">
                  <span>2</span>
                  <div>
                    <h2>Payment</h2>
                    <p>{rules.cod_note || "Cash on delivery is available across Pakistan."}</p>
                  </div>
                </header>
                <div className="pay-grid">
                  {PAYMENTS.map((method) => (
                    <label key={method.id} className={`pay-card ${form.payment_method === method.id ? "on" : ""}`}>
                      <input type="radio" name="payment" value={method.id} checked={form.payment_method === method.id} onChange={() => set("payment_method", method.id)} />
                      <span className="pay-icon" aria-hidden>{method.icon}</span>
                      <span>
                        <strong>{method.title}</strong>
                        <small>{method.text}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="form-card">
                <header className="checkout-block-head">
                  <span>3</span>
                  <div>
                    <h2>Gift note</h2>
                    <p>Free wrapping on orders over PKR {Number(rules.gift_wrap_over || 3000).toLocaleString("en-PK")}.</p>
                  </div>
                </header>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="notes">Message for the parcel</label>
                  <textarea id="notes" rows={3} value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Happy birthday, Zara" />
                </div>
              </section>
            </div>

            <aside className="form-card checkout-summary">
              <h2>Your order</h2>
              <ul className="checkout-items">
                {cart.map((item) => (
                  <li key={item.id}>
                    <span className="checkout-emoji" style={{ background: item.gradient || "#FFF3E0" }}>{item.emoji}</span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>Qty {item.qty}</small>
                    </span>
                    <b>{pkr(item.price * item.qty)}</b>
                  </li>
                ))}
              </ul>
              <Link className="checkout-edit" href="/cart">Edit cart</Link>

              <div className="ship-meter">
                <div className="ship-meter-bar"><div style={{ width: `${Math.min(100, (payable / freeOver) * 100)}%` }} /></div>
                <p>{untilFree > 0 ? `Add ${pkr(untilFree)} more for free delivery` : "Free delivery is unlocked"}</p>
              </div>

              <div className="coupon-row">
                <input value={form.coupon_code} onChange={(event) => set("coupon_code", event.target.value.toUpperCase())} placeholder="Promo code" aria-label="Promo code" />
                <button type="button" className="btn btn-outline" onClick={applyCode}>Apply</button>
              </div>
              {message ? <p className={messageOk ? "checkout-note good" : "checkout-note bad"}>{message}</p> : null}

              <div className="checkout-totals">
                <div className="summary-line"><span>Subtotal</span><span>{pkr(subtotal)}</span></div>
                <div className="summary-line"><span>Discount</span><span>{discount ? `-${pkr(discount)}` : pkr(0)}</span></div>
                <div className="summary-line"><span>Delivery</span><span>{shipping ? pkr(shipping) : "Free"}</span></div>
                <div className="summary-line total"><span>Total</span><span>{pkr(total)}</span></div>
              </div>

              <button className="btn btn-orange checkout-place" type="submit" disabled={placing}>
                {placing ? "Placing order…" : `Place order · ${pkr(total)}`}
              </button>
              <ul className="checkout-trust">
                <li>Cash on delivery</li>
                <li>2–5 day delivery</li>
                <li>30-day returns</li>
              </ul>
            </aside>
          </form>
        )}
      </div>
    </>
  );
}

function OrderPlaced({ order }) {
  const method = PAYMENTS.find((item) => item.id === order.payment_method);
  return (
    <div className="page-body">
      <div className="checkout-success form-card">
        <div className="checkout-success-mark">✓</div>
        <p className="checkout-kicker">Order confirmed</p>
        <h1 className="sec-head">{order.order_no}</h1>
        <p className="sec-sub">Thank you, {order.customer_name}. We will call {order.phone} before delivery in {order.city}.</p>
        <div className="checkout-success-grid">
          <div><span>To pay</span><strong>{pkr(order.total)}</strong></div>
          <div><span>Payment</span><strong>{method?.title || order.payment_method}</strong></div>
          <div><span>Deliver to</span><strong>{order.city}</strong></div>
        </div>
        <div className="row-actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-orange" href={`/track`}>Track this order</Link>
          <Link className="btn btn-outline" href="/">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
