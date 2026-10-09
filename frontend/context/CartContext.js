"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wish, setWish] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("kidlo_cart") || "[]"));
      setWish(JSON.parse(localStorage.getItem("kidlo_wish") || "[]"));
    } catch {
      setCart([]);
      setWish([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("kidlo_cart", JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("kidlo_wish", JSON.stringify(wish));
  }, [wish, ready]);

  function toast(message) {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 2400);
  }

  function add(product, qty = 1) {
    const existing = cart.find((item) => item.id === product.id);
    const stock = Number(product.stock ?? existing?.stock ?? 99);
    if (stock <= 0) {
      toast("This toy is sold out");
      return;
    }
    const nextQty = Math.min(stock, (existing?.qty || 0) + qty);
    if (existing && nextQty === existing.qty) {
      toast(`Only ${stock} in stock`);
      return;
    }
    setCart((list) => {
      const found = list.find((item) => item.id === product.id);
      if (found) return list.map((item) => (item.id === product.id ? { ...item, qty: nextQty, stock } : item));
      return [...list, { id: product.id, slug: product.slug, name: product.name, emoji: product.emoji, image_url: product.image_url || "", image_alt: product.image_alt || "", price: product.price, gradient: product.gradient, qty: nextQty, stock }];
    });
    toast(`${product.name} added to cart`);
  }

  function setQty(id, qty) {
    setCart((list) => list.flatMap((item) => {
      if (item.id !== id) return [item];
      const stock = Number(item.stock || 99);
      const next = Math.max(1, Math.min(stock, qty));
      return [{ ...item, qty: next }];
    }));
  }

  function remove(id) {
    setCart((list) => list.filter((item) => item.id !== id));
  }

  function clear() {
    setCart([]);
  }

  function toggleWish(product) {
    const exists = wish.some((item) => item.id === product.id);
    setWish(exists
      ? wish.filter((item) => item.id !== product.id)
      : [...wish, { id: product.id, slug: product.slug, name: product.name, emoji: product.emoji, image_url: product.image_url || "", image_alt: product.image_alt || "", price: product.price, gradient: product.gradient, stock: product.stock }]);
    toast(exists ? "Removed from wishlist" : "Saved to wishlist");
  }

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, wish, ready, add, setQty, remove, clear, toggleWish, count, subtotal, toast, wished: (id) => wish.some((item) => item.id === id) }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((item) => (
          <div key={item.id} className="toast show">✅ {item.message}</div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
