"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

const GROUPS = [
  { key: "shop", label: "Shop", href: "/search", all: "All toys" },
  { key: "boys", label: "Boys", href: "/shop/boys-toys", all: "All boys toys" },
  { key: "girls", label: "Girls", href: "/shop/girls-toys", all: "All girls toys" },
];

export default function Header({ shell }) {
  const router = useRouter();
  const pathname = usePathname();
  const { count, wish } = useCart();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("");
  const [bar, setBar] = useState(true);
  const [customer, setCustomer] = useState("");
  const [top, setTop] = useState(false);
  const sections = Object.fromEntries((shell?.sections || []).map((row) => [row.section_key, row.payload]));
  const categories = (shell?.categories || []).filter((row) => row.show_in_nav);
  const announcement = sections.announcement;

  useEffect(() => {
    setOpen(false);
    setOpenGroup("");
  }, [pathname]);

  useEffect(() => {
    if (sessionStorage.getItem("kidlo_topbar") === "off") setBar(false);
    try {
      const saved = JSON.parse(localStorage.getItem("kidlo_customer_profile") || "null");
      setCustomer(saved?.name || "");
    } catch {
      setCustomer("");
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function search(event) {
    event.preventDefault();
    setOpen(false);
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
  }

  function closeBar() {
    sessionStorage.setItem("kidlo_topbar", "off");
    setBar(false);
  }

  function onGroupClick(event, key) {
    if (window.matchMedia("(max-width: 1100px)").matches) {
      event.preventDefault();
      setOpenGroup((value) => (value === key ? "" : key));
    }
  }

  return (
    <>
      {announcement && bar ? (
        <div className="topbar">
          🎉 <span className="hl">{announcement.highlight}</span> — {announcement.text} <span className="hl">{announcement.code}</span>
          <span> | {announcement.extra}</span>
          <button className="close-top" onClick={closeBar} aria-label="Dismiss announcement">✕</button>
        </div>
      ) : null}
      {open ? <button className="nav-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <nav>
        <Link href="/" className="nav-logo" onClick={() => setOpen(false)}><img src="/logo.png" alt="Kidlo Toys" /></Link>
        <button className="menu-btn" type="button" onClick={() => setOpen((value) => !value)} aria-label="Menu" aria-expanded={open}>{open ? "✕" : "☰"}</button>
        <ul className={`nav-menu ${open ? "open" : ""}`}>
          {GROUPS.map((group) => (
            <li key={group.key} className={openGroup === group.key ? "open" : ""}>
              <Link href={group.href} onClick={(event) => onGroupClick(event, group.key)}>
                {group.label} <span className="arrow">▾</span>
              </Link>
              <div className="mega-drop">
                <Link href={group.href} className="drop-item" onClick={() => setOpen(false)}>
                  <div className="drop-icon" style={{ background: group.key === "girls" ? "#FFE8F3" : group.key === "boys" ? "#E8F0FF" : "#FFF3E0" }}>🛍️</div>
                  <div><span>{group.all}</span><small>Browse this collection</small></div>
                </Link>
                {categories.filter((row) => row.nav_group === group.key).map((row) => (
                  <Link key={row.slug} href={`/shop/${row.slug}`} className="drop-item" onClick={() => setOpen(false)}>
                    <div className="drop-icon" style={{ background: group.key === "girls" ? "#FFE8F3" : group.key === "boys" ? "#E8F0FF" : "#FFF3E0" }}>{row.emoji}</div>
                    <div><span>{row.name}</span><small>{row.blurb || row.count_label}</small></div>
                  </Link>
                ))}
              </div>
            </li>
          ))}
          {(sections.nav_links?.items || []).map((item) => (
            <li key={item.href}><Link href={item.href} onClick={() => setOpen(false)}>{item.label === "Deals" ? "🔥 Deals" : item.label}</Link></li>
          ))}
        </ul>
        <form className="nav-search" onSubmit={search}>
          <span>🔍</span>
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search toys, brands..." aria-label="Search toys" />
          <button className="search-go" type="submit">Search</button>
        </form>
        <div className="nav-actions">
          <Link href="/wishlist" className="icon-btn" title="Wishlist" onClick={() => setOpen(false)}>❤️{wish.length ? <span className="badge">{wish.length}</span> : null}</Link>
          <Link href="/cart" className="icon-btn" title="Cart" onClick={() => setOpen(false)}>🛒{count ? <span className="badge">{count}</span> : null}</Link>
          <Link href="/account" className="btn btn-teal account-btn" onClick={() => setOpen(false)}>
            <span aria-hidden>👤</span>
            <span className="login-label">{customer ? customer.split(" ")[0] : "Login"}</span>
          </Link>
        </div>
      </nav>
      <button id="btt" className={top ? "show" : ""} type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">↑</button>
    </>
  );
}
