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
  ["/admin/orders", "Orders"],
  ["/admin/pages", "Pages"],
  ["/admin/seo_entries", "SEO"],
  ["/admin/blog_posts", "Blog"],
  ["/admin/reviews", "Reviews"],
  ["/admin/coupons", "Coupons"],
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

  useEffect(() => {
    if (!localStorage.getItem("kidlo_admin")) router.replace("/admin/login");
    else setReady(true);
  }, [router]);

  if (!ready) return null;
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">Kidlo Admin</div>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? "active" : ""}>{label}</Link>
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
