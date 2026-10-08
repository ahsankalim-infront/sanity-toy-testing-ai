"use client";

import { useEffect, useState } from "react";
import { api, pkr } from "../../lib/format";
import { adminHeaders } from "../../components/admin/AdminShell";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/stats", { headers: adminHeaders() }).then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <p>{error}</p>;
  if (!stats) return <p>Loading dashboard…</p>;
  return (
    <>
      <div className="admin-top">
        <h1 className="sec-head" style={{ fontSize: 34 }}>Store dashboard</h1>
        <span className={`pill ${stats.mysql ? "good" : "bad"}`}>{stats.mysql ? "MySQL live · JSON mirrored" : "MySQL down · serving JSON"}</span>
      </div>
      {!stats.mysql && stats.lastError ? <p className="note">Database note: {stats.lastError}. The shop keeps reading and writing the JSON copy, then pushes those tables when MySQL returns.</p> : null}
      <div className="stat-grid">
        <div className="stat-card"><span>Products</span><b>{stats.products}</b></div>
        <div className="stat-card"><span>Orders</span><b>{stats.orders}</b></div>
        <div className="stat-card"><span>Revenue</span><b style={{ fontSize: 22 }}>{pkr(stats.revenue)}</b></div>
        <div className="stat-card"><span>New messages</span><b>{stats.inquiries}</b></div>
      </div>
      <div className="form-card">
        <p>Low stock items: {stats.lowStock}. Pending JSON sync tables: {stats.pendingSync}.</p>
        <p className="muted">Edit a homepage block from Homepage sections. Hide a block with its enabled switch and the storefront drops it on the next load.</p>
      </div>
    </>
  );
}
