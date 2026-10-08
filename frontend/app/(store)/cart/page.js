"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, pkr } from "../../../lib/format";
import { useCart } from "../../../context/CartContext";

export default function CartPage() {
  const { cart, setQty, remove, subtotal } = useCart();
  const [rules, setRules] = useState({ free_shipping_over: 2000, shipping_fee: 199 });
  const shipping = subtotal === 0 || subtotal >= Number(rules.free_shipping_over) ? 0 : Number(rules.shipping_fee);
  useEffect(() => {
    api("/api/shell").then((shell) => {
      const commerce = (shell.sections || []).find((row) => row.section_key === "commerce");
      if (commerce?.payload) setRules(commerce.payload);
    }).catch(() => {});
  }, []);
  return (
    <>
      <div className="page-hero"><div className="crumb"><Link href="/">Home</Link> / Cart</div><h1>Your Cart</h1></div>
      <div className="page-body">
        {!cart.length ? (
          <div className="empty"><div className="big">🛒</div><h2 className="sec-head">The cart is empty</h2><Link className="btn btn-orange" href="/shop/boys-toys">Shop toys</Link></div>
        ) : (
          <div className="cart-layout">
            <div className="form-card">
              {cart.map((item) => (
                <div className="cart-row" key={item.id}>
                  <div className="rv-emoji" style={{ fontSize: 36 }}>{item.emoji}</div>
                  <div>
                    <Link href={`/product/${item.slug}`}><strong>{item.name}</strong></Link>
                    <div className="muted">{pkr(item.price)}</div>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button type="button" onClick={() => setQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div className="cart-line">
                    <strong>{pkr(item.price * item.qty)}</strong>
                    <button type="button" className="text-btn" onClick={() => remove(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <aside className="form-card">
              <h2 className="sec-head" style={{ fontSize: 28 }}>Summary</h2>
              <div className="summary-line"><span>Subtotal</span><span>{pkr(subtotal)}</span></div>
              <div className="summary-line"><span>Delivery</span><span>{shipping ? pkr(shipping) : "Free"}</span></div>
              <div className="summary-line total"><span>Total</span><span>{pkr(subtotal + shipping)}</span></div>
              <p className="muted">Free delivery over PKR {Number(rules.free_shipping_over).toLocaleString("en-PK")}. A code can be applied at checkout.</p>
              <Link className="btn btn-orange" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} href="/checkout">Checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
