"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { api, discount, pkr, stars } from "../lib/format";
import { useCart } from "../context/CartContext";

export default function ProductView({ slug }) {
  const { add, toggleWish, wished } = useCart();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ author: "", city: "", stars: 5, text: "" });
  const [sent, setSent] = useState("");

  useEffect(() => {
    api(`/api/products/${slug}`).then((payload) => {
      setData(payload);
      const recent = JSON.parse(localStorage.getItem("kidlo_recent") || "[]").filter((id) => id !== payload.product.id);
      localStorage.setItem("kidlo_recent", JSON.stringify([payload.product.id, ...recent].slice(0, 8)));
    }).catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <section className="page-body">{error}</section>;
  if (!data) return <section className="page-body">Loading toy…</section>;
  const { product, related, reviews } = data;
  const off = discount(product.price, product.compare_price);

  async function review(event) {
    event.preventDefault();
    try {
      await api("/api/reviews", { method: "POST", body: { ...form, product_id: product.id } });
      setSent("Thank you. Your review is on the page.");
      const fresh = await api(`/api/products/${slug}`);
      setData(fresh);
    } catch (err) {
      setSent(err.message);
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="crumb"><Link href="/">Home</Link> / <Link href={`/shop/${product.category_slug}`}>{product.category_slug}</Link> / {product.name}</div>
      </div>
      <div className="page-body">
        <div className="pdp">
          <div className="pdp-visual" style={{ background: product.gradient }}>{product.emoji}</div>
          <div>
            <span className="pcard-tag">{product.age_label}</span>
            <h1 className="sec-head" style={{ fontSize: 40 }}>{product.name}</h1>
            <div className="stars" style={{ marginBottom: 10 }}>{stars(product.rating)} <span className="muted">({product.review_count})</span></div>
            <div style={{ marginBottom: 12 }}>
              {off ? <span className="pcard-old">{pkr(product.compare_price)}</span> : null}
              <span className="pdp-price">{pkr(product.price)}</span>
              {off ? <span className="pcard-dis">-{off}%</span> : null}
            </div>
            <p className="sec-sub" style={{ marginBottom: 16 }}>{product.description}</p>
            <p className="muted" style={{ marginBottom: 16 }}>Brand {product.brand} · SKU {product.sku} · {product.stock > 0 ? `${product.stock} in stock` : "Sold out"} · COD available</p>
            <div className="row-actions" style={{ marginBottom: 18 }}>
              <div className="qty">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((value) => Math.min(Number(product.stock) || 1, value + 1))} disabled={qty >= Number(product.stock)}>+</button>
              </div>
              <button className="btn btn-orange" disabled={product.stock <= 0} onClick={() => add(product, qty)}>🛒 Add to Cart</button>
              <button className="btn btn-outline" onClick={() => toggleWish(product)}>{wished(product.id) ? "❤️ Saved" : "🤍 Wishlist"}</button>
            </div>
          </div>
        </div>

        <h2 className="sec-head" style={{ fontSize: 32, marginTop: 36 }}>Reviews</h2>
        <div className="testi-grid" style={{ marginTop: 16 }}>
          {reviews.map((reviewItem) => (
            <article key={reviewItem.id} className="testi-card">
              <div className="testi-stars">{"★".repeat(reviewItem.stars)}</div>
              <p className="testi-text">"{reviewItem.text}"</p>
              <div className="tname">{reviewItem.author} · {reviewItem.city}</div>
            </article>
          ))}
        </div>
        <form className="form-card" style={{ marginTop: 18, maxWidth: 640 }} onSubmit={review}>
          <h3 className="sec-head" style={{ fontSize: 26 }}>Write a review</h3>
          <div className="form-grid">
            <div className="field"><label>Name</label><input required value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></div>
            <div className="field"><label>City</label><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
          </div>
          <div className="field"><label>Stars</label>
            <select value={form.stars} onChange={(event) => setForm({ ...form, stars: Number(event.target.value) })}>
              {[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star}</option>)}
            </select>
          </div>
          <div className="field"><label>Review</label><textarea required rows={4} value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} /></div>
          <button className="btn btn-orange" type="submit">Publish review</button>
          {sent ? <p className="muted" style={{ marginTop: 10 }}>{sent}</p> : null}
        </form>

        {related.length ? (
          <>
            <h2 className="sec-head" style={{ fontSize: 32, margin: "36px 0 16px" }}>You may also like</h2>
            <div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
          </>
        ) : null}
      </div>
    </>
  );
}
