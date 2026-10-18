"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { discount, pkr, stars } from "../lib/format";
import { useCart } from "../context/CartContext";
import ProductMedia from "./ProductMedia";

export default function ProductCard({ product }) {
  const router = useRouter();
  const { add, toggleWish, wished } = useCart();
  const off = discount(product.price, product.compare_price);
  const soldOut = Number(product.stock) <= 0;
  return (
    <article className="pcard">
      <div className="pcard-img" style={{ background: product.gradient }}>
        {!product.image_url ? <span className="bg-emoji">{product.emoji}</span> : null}
        <ProductMedia product={product} />
        {product.badge ? <span className={`pbadge ${product.badge}`}>{product.badge.toUpperCase()}</span> : null}
        <button type="button" className="pcard-wish" onClick={() => toggleWish(product)} aria-label="Wishlist">
          {wished(product.id) ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="pcard-body">
        <span className="pcard-tag">{product.age_label}</span>
        <Link href={`/product/${product.slug}`}><p className="pcard-name">{product.name}</p></Link>
        <div className="pcard-stars">{stars(product.rating)}<span>({product.review_count} reviews)</span></div>
        <div className="pcard-price-row">
          <div>
            {off ? <span className="pcard-old">{pkr(product.compare_price)}</span> : null}
            <span className="pcard-price">{pkr(product.price)}</span>
          </div>
          {off ? <span className="pcard-dis">-{off}%</span> : product.badge === "new" ? <span className="pcard-dis">Fan Fav</span> : null}
        </div>
        <div className="pcard-actions">
          <button type="button" className="pcard-add" disabled={soldOut} onClick={() => add(product)}>
            {soldOut ? "Sold Out" : "🛒 Add to Cart"}
          </button>
          {soldOut ? null : (
            <button type="button" className="pcard-buy" onClick={() => { if (add(product)) router.push("/checkout"); }}>
              Buy
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
