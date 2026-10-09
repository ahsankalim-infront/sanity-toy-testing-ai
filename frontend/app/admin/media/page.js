"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MediaUploader from "../../../components/admin/MediaUploader";
import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import { api } from "../../../lib/format";

export default function MediaLibraryPage() {
  const { rows, error, reload } = useAdminRows("media_files");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => rows.filter((row) => `${row.file_name} ${row.alt_text}`.toLowerCase().includes(query.trim().toLowerCase())), [rows, query]);

  async function remove(row) {
    if (!confirm(`Delete ${row.file_name}? Products using this link will keep the file.`)) return;
    try {
      await api(`/api/admin/media_files/${row.id}`, { method: "DELETE", headers: adminHeaders() });
      await reload();
      setNote("Image removed from the media library.");
    } catch (err) {
      setNote(err.message);
    }
  }

  async function copy(url) {
    await navigator.clipboard.writeText(url);
    setNote("Image link copied. Paste it into a product's Image URL field.");
  }

  return (
    <>
      <div className="admin-top media-admin-head">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Product Media</h1>
          <p className="muted">Upload product images once, then select them inside the product editor. Emoji remains the automatic fallback when no image is selected.</p>
        </div>
        <Link className="btn btn-outline" href="/admin/products">Manage products</Link>
      </div>
      {error ? <p className="note">{error}</p> : null}
      {note ? <p className="note">{note}</p> : null}
      <MediaUploader onUploaded={() => reload()} />
      <div className="media-library-head">
        <h2>Media library</h2>
        <span>{visible.length} {visible.length === 1 ? "image" : "images"}</span>
      </div>
      <div className="product-admin-toolbar">
        <div className="nav-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file name or alt text" aria-label="Search media" /></div>
      </div>
      {visible.length ? (
        <div className="media-library-grid">
          {[...visible].reverse().map((row) => (
            <article className="media-card" key={row.id}>
              <div className="media-card-preview"><img src={row.url} alt={row.alt_text || row.file_name} loading="lazy" /></div>
              <div className="media-card-body">
                <strong title={row.file_name}>{row.file_name}</strong>
                <small>{row.mime_type.replace("image/", "").toUpperCase()} · {formatSize(row.size)}</small>
                <p>{row.alt_text || "No alt text"}</p>
                <div className="row-actions">
                  <button className="btn btn-outline" type="button" onClick={() => copy(row.url)}>Copy link</button>
                  <button className="text-btn" type="button" onClick={() => remove(row)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty form-card"><div className="big">🖼️</div><h2>No product images yet</h2><p className="muted">Upload the first image above.</p></div>}
    </>
  );
}

function formatSize(bytes) {
  const value = Number(bytes || 0);
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}
