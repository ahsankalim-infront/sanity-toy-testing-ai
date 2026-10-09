"use client";

export default function ProductMedia({ product, className = "", emojiClass = "", loading = "lazy" }) {
  if (product?.image_url) {
    return (
      <img
        className={`product-photo ${className}`.trim()}
        src={product.image_url}
        alt={product.image_alt || product.name || "Product"}
        loading={loading}
      />
    );
  }
  return <span className={emojiClass}>{product?.emoji || "🧸"}</span>;
}
