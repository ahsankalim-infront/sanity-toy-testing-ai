"use client";

import Link from "next/link";
import { pkr } from "../../../lib/format";
import { useCart } from "../../../context/CartContext";
import ProductMedia from "../../../components/ProductMedia";

export default function WishlistPage() {
  const { wish, toggleWish, add } = useCart();
  return (
    <>
      <div className="page-hero"><h1>Wishlist</h1><p className="sec-sub">Saved on this browser until you are ready to buy.</p></div>
      <div className="page-body">
        {!wish.length ? <div className="empty"><div className="big">❤️</div><Link className="btn btn-orange" href="/">Find a toy</Link></div> : (
          <div className="product-grid">
            {wish.map((item) => (
              <article className="pcard" key={item.id}>
                <div className="pcard-img" style={{ background: item.gradient || "#FFF3E0" }}><ProductMedia product={item} /></div>
                <div className="pcard-body">
                  <Link href={`/product/${item.slug}`}><p className="pcard-name">{item.name}</p></Link>
                  <div className="pcard-price">{pkr(item.price)}</div>
                  <div className="row-actions" style={{ marginTop: 10 }}>
                    <button className="btn btn-orange" onClick={() => add(item)}>Add to cart</button>
                    <button className="btn btn-outline" onClick={() => toggleWish(item)}>Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
