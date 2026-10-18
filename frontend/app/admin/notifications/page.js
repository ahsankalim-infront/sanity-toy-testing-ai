"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import { api } from "../../../lib/format";

export default function NotificationsPage() {
  const { rows, error, reload } = useAdminRows("notifications");
  const [filter, setFilter] = useState("unread");
  const [note, setNote] = useState("");
  const visible = useMemo(() => {
    const list = [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return filter === "unread" ? list.filter((row) => !Number(row.read)) : list;
  }, [rows, filter]);
  const unread = rows.filter((row) => !Number(row.read)).length;

  async function mark(row) {
    await api(`/api/admin/notifications/${row.id}`, { method: "PUT", headers: adminHeaders(), body: { ...row, read: 1 } });
    await reload();
  }

  async function markAll() {
    await api("/api/admin/notifications/read-all", { method: "POST", headers: adminHeaders(), body: {} });
    setNote("All notifications marked as read.");
    await reload();
  }

  async function remove(row) {
    if (!confirm("Delete this notification?")) return;
    await api(`/api/admin/notifications/${row.id}`, { method: "DELETE", headers: adminHeaders() });
    await reload();
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Notifications</h1>
          <p className="muted">{unread} unread. New orders, messages, reviews, subscribers, and low-stock alerts appear here.</p>
        </div>
        <button className="btn btn-outline" type="button" disabled={!unread} onClick={markAll}>Mark all read</button>
      </div>
      {error ? <p className="note">{error}</p> : null}
      {note ? <p className="note">{note}</p> : null}
      <div className="product-admin-toolbar">
        <div className="seg">
          <button type="button" className={filter === "unread" ? "on" : ""} onClick={() => setFilter("unread")}>Unread</button>
          <button type="button" className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
        </div>
        <span>{visible.length} {visible.length === 1 ? "notification" : "notifications"}</span>
      </div>
      {visible.length ? (
        <div className="admin-record-list">
          {visible.map((row) => (
            <article className={`admin-record notice-row ${Number(row.read) ? "" : "unread"}`} key={row.id}>
              <div className="admin-record-mark">{icon(row.type)}</div>
              <div className="admin-record-main">
                <strong>{row.title}</strong>
                <span>{row.body}</span>
                <small>{new Date(row.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</small>
              </div>
              <div className="row-actions">
                <Link className="btn btn-outline" href={row.href || "/admin"}>Open</Link>
                {Number(row.read) ? null : <button className="btn btn-orange" type="button" onClick={() => mark(row)}>Mark read</button>}
                <button className="text-btn" type="button" onClick={() => remove(row)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty form-card"><div className="big">🔔</div><h2>You are all caught up</h2><p className="muted">New store activity will show up here.</p></div>}
    </>
  );
}

function icon(type) {
  return { order: "📦", inquiry: "💬", review: "⭐", newsletter: "✉️", stock: "⚠️", payment: "🧾" }[type] || "🔔";
}
