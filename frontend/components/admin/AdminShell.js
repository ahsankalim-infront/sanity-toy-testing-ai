"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../lib/format";

const LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/sections", "Homepage sections"],
  ["/admin/products", "Products"],
  ["/admin/media", "Product media"],
  ["/admin/categories", "Categories"],
  ["/admin/notifications", "Notifications"],
  ["/admin/orders", "Orders"],
  ["/admin/pages", "Pages"],
  ["/admin/seo_entries", "SEO"],
  ["/admin/blog_posts", "Blog"],
  ["/admin/reviews", "Reviews"],
  ["/admin/coupons", "Coupons"],
  ["/admin/games", "Games"],
  ["/admin/coins", "Kidlo Coins"],
  ["/admin/whatsapp", "WhatsApp"],
  ["/admin/inquiries", "Messages"],
  ["/admin/newsletter", "Newsletter"],
];

export function adminHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("kidlo_admin") : "";
  return { Authorization: `Bearer ${token}` };
}

export default function AdminShell({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("kidlo_admin")) router.replace("/admin/login");
    else setReady(true);
  }, [router]);

  useEffect(() => { setMenu(false); }, [path]);

  useEffect(() => {
    if (!ready) return undefined;
    let stop = false;
    async function load() {
      try {
        const data = await api("/api/admin/notifications", { headers: adminHeaders() });
        if (!stop) setUnread(data.rows.filter((row) => !Number(row.read)).length);
      } catch { /* the page shows its own error if the session expired */ }
    }
    load();
    const timer = setInterval(load, 20000);
    return () => { stop = true; clearInterval(timer); };
  }, [ready, path]);

  if (!ready) return null;
  return (
    <div className={`admin-shell ${menu ? "nav-open" : ""}`}>
      <header className="admin-topbar">
        <button className="menu-btn" type="button" aria-label="Open admin menu" onClick={() => setMenu(true)}>☰</button>
        <strong>Kidlo Admin</strong>
        <Link className="admin-bell" href="/admin/notifications" aria-label="Notifications">🔔{unread ? <b>{unread}</b> : null}</Link>
      </header>
      {menu ? <button className="admin-backdrop" type="button" aria-label="Close admin menu" onClick={() => setMenu(false)} /> : null}
      <aside className="admin-side">
        <div className="admin-brand">Kidlo Admin</div>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? "active" : ""}>
            {label}
            {href === "/admin/notifications" && unread ? <span className="nav-count">{unread}</span> : null}
          </Link>
        ))}
        <Link href="/">View store</Link>
        <button className="btn btn-outline" style={{ marginTop: 12, color: "white", borderColor: "white" }} onClick={() => { localStorage.removeItem("kidlo_admin"); router.push("/admin/login"); }}>Log out</button>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}

export function useAdminRows(table) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  async function reload() {
    const data = await api(`/api/admin/${table}`, { headers: adminHeaders() });
    setRows(data.rows);
  }
  useEffect(() => {
    reload().catch((err) => setError(err.message));
  }, [table]);
  return { rows, setRows, error, reload };
}
