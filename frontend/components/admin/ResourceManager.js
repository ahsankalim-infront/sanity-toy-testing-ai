"use client";

import { useMemo, useState } from "react";
import { adminHeaders, useAdminRows } from "./AdminShell";
import { api, pkr } from "../../lib/format";

const PAGE_SIZE = 12;
const LABELS = {
  order_no: "Order", customer_name: "Customer", payment_method: "Payment", group_name: "Group", nav_group: "Menu",
  parent_slug: "Parent", sort_order: "Sort", show_on_home: "Homepage", show_in_footer: "Footer", show_in_nav: "Navigation",
  min_order: "Minimum order", read_time: "Reading time", published_at: "Published", product_id: "Product", og_type: "Share type",
  schema_json: "Structured data", image_alt: "Alt text", created_at: "Created", updated_at: "Updated", count_label: "Count label",
  filter_tag: "Filter tag", virtual_value: "Virtual value", coupon_code: "Coupon", country_code: "Country code", country_name: "Country",
  dial_code: "Dial code",
};
const MONEY = new Set(["price", "compare_price", "total", "subtotal", "shipping", "discount", "min_order", "value"]);

export default function ResourceManager({ table, title, description, columns, blank, identity = {}, search = [], filters = [], allowCreate = true }) {
  const { rows, error, reload } = useAdminRows(table);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const keys = search.length ? search : columns;
    return rows.filter((row) => {
      const text = keys.map((key) => row[key]).join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query.trim().toLowerCase());
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => value === "all" || String(row[key]) === value);
      return matchesQuery && matchesFilters;
    });
  }, [rows, query, activeFilters, search, columns]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function edit(row) {
    setDraft(JSON.parse(JSON.stringify(row)));
    setNote("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event) {
    event.preventDefault();
    const body = { ...draft };
    try {
      event.currentTarget.querySelectorAll("textarea.json-box").forEach((box) => {
        body[box.dataset.key] = JSON.parse(box.value);
      });
      if (body.id) await api(`/api/admin/${table}/${body.id}`, { method: "PUT", headers: adminHeaders(), body });
      else await api(`/api/admin/${table}`, { method: "POST", headers: adminHeaders(), body });
      setDraft(null);
      setNote("Saved successfully.");
      await reload();
    } catch (err) {
      setNote(err.message || "Check the form and try again.");
    }
  }

  async function remove(row) {
    const name = row[identity.title] || row[columns[0]] || `#${row.id}`;
    if (!confirm(`Delete ${name}?`)) return;
    await api(`/api/admin/${table}/${row.id}`, { method: "DELETE", headers: adminHeaders() });
    setNote("Record deleted.");
    await reload();
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>{title}</h1>
          {description ? <p className="muted" style={{ maxWidth: 760 }}>{description}</p> : null}
        </div>
        {allowCreate ? <button className="btn btn-orange" onClick={() => edit({ ...blank })}>+ Add</button> : null}
      </div>
      {error ? <p className="note">{error}</p> : null}
      {note ? <p className="note">{note}</p> : null}

      {draft ? (
        <form className="form-card admin-record-form" key={draft.id || "new"} onSubmit={save}>
          <div className="admin-record-form-head">
            <h2>{draft.id ? `Edit ${draft[identity.title] || `#${draft.id}`}` : `New ${title.toLowerCase().replace(/s$/, "")}`}</h2>
            <div className="row-actions">
              <button className="btn btn-outline" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-orange" type="submit">Save</button>
            </div>
          </div>
          <div className="admin-form-grid">
            {Object.keys(blank).concat(Object.keys(draft).filter((key) => !(key in blank) && !["id", "created_at", "updated_at"].includes(key))).map((key) => (
              key === "image_alt" && "image_url" in blank ? null : (
                <div className={`field ${key === "image_url" || wideField(key, draft[key]) ? "wide" : ""}`} key={key}>
                  {key === "image_url" ? <ImagePicker draft={draft} onChange={setDraft} /> : <><label>{labelFor(key)}</label><ValueField field={key} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} /></>}
                </div>
              )
            ))}
          </div>
        </form>
      ) : null}

      <div className="product-admin-toolbar">
        <div className="nav-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}`} aria-label={`Search ${title}`} /></div>
        {filters.map((filter) => (
          <select key={filter.key} value={activeFilters[filter.key] || "all"} onChange={(event) => { setActiveFilters({ ...activeFilters, [filter.key]: event.target.value }); setPage(1); }} aria-label={filter.label}>
            {filter.options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        ))}
        <span>{filtered.length} {filtered.length === 1 ? "record" : "records"}</span>
      </div>

      {visible.length ? (
        <div className="admin-record-list">
          {visible.map((row) => (
            <article className="admin-record" key={row.id}>
              <div className={`admin-record-mark ${row.image_url ? "has-photo" : ""}`}>{row.image_url ? <img src={row.image_url} alt={row.image_alt || ""} /> : (row[identity.emoji] || row.emoji || "•")}</div>
              <div className="admin-record-main">
                <strong>{display(row[identity.title] ?? row[columns[0]])}</strong>
                <span>{identity.subtitle ? display(row[identity.subtitle], identity.subtitle) : `#${row.id}`}</span>
              </div>
              <div className="admin-record-meta">
                {columns.filter((key) => key !== identity.title).slice(0, 3).map((key) => (
                  <div key={key}><small>{labelFor(key)}</small><b>{display(row[key], key)}</b></div>
                ))}
              </div>
              <div className="row-actions">
                <button className="btn btn-outline" onClick={() => edit(row)}>Edit</button>
                <button className="text-btn" onClick={() => remove(row)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty form-card"><div className="big">🔎</div><h2>No matching records</h2><p className="muted">Try another search or clear the filters.</p></div>}

      {pages > 1 ? (
        <div className="admin-pager">
          <button className="btn btn-outline" type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage} of {pages}</span>
          <button className="btn btn-outline" type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button>
        </div>
      ) : null}
    </>
  );
}

function labelFor(key) {
  return LABELS[key] || key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function display(value, key = "") {
  if (value && typeof value === "object") return "Custom data";
  if (MONEY.has(key) && key !== "value") return pkr(value);
  if (key === "value") return String(value);
  if (["active", "enabled", "verified", "featured", "is_deal"].includes(key)) return Number(value) ? "Yes" : "No";
  if (key === "created_at" || key === "updated_at") return value ? new Date(value).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const text = String(value ?? "—");
  return text.length > 72 ? `${text.slice(0, 72)}…` : text || "—";
}

function wideField(key, value) {
  return ["content", "description", "message", "notes", "text", "excerpt", "address", "keywords", "canonical"].includes(key) || (value && typeof value === "object") || String(value ?? "").length > 80;
}

function ImagePicker({ draft, onChange }) {
  const media = useAdminRows("media_files");
  const [open, setOpen] = useState(false);
  const label = draft.title || draft.name || "this record";

  function choose(row) {
    onChange({ ...draft, image_url: row.url, image_alt: draft.image_alt || row.alt_text || label });
    setOpen(false);
  }

  return (
    <div className="record-image-picker">
      <label>Image</label>
      <div className="record-image-row">
        <div className={`product-admin-thumb ${draft.image_url ? "has-photo" : ""}`}>{draft.image_url ? <img src={draft.image_url} alt={draft.image_alt || label} /> : <span>{draft.emoji || "🖼️"}</span>}</div>
        <div>
          <p className="admin-help">An uploaded image replaces the emoji on the storefront. Leave it empty to keep the emoji.</p>
          <div className="row-actions">
            <button className="btn btn-outline" type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close library" : "Choose image"}</button>
            {draft.image_url ? <button className="text-btn" type="button" onClick={() => onChange({ ...draft, image_url: "" })}>Use emoji</button> : null}
          </div>
        </div>
      </div>
      {open ? (
        <div className="product-media-picker">
          {media.rows.length ? [...media.rows].reverse().map((row) => (
            <button type="button" key={row.id} className={row.url === draft.image_url ? "selected" : ""} onClick={() => choose(row)}>
              <img src={row.url} alt={row.alt_text || row.file_name} /><span>{row.alt_text || row.file_name}</span>
            </button>
          )) : <p>No images yet. Upload one from Product media first.</p>}
        </div>
      ) : null}
      <div className="field"><label>Image URL</label><input value={draft.image_url || ""} onChange={(event) => onChange({ ...draft, image_url: event.target.value })} placeholder="/api/media/products/image.webp" /></div>
      <div className="field"><label>Image alt text</label><input value={draft.image_alt || ""} onChange={(event) => onChange({ ...draft, image_alt: event.target.value })} placeholder={`Describe ${label}`} /></div>
    </div>
  );
}

function ValueField({ field, value, onChange }) {
  if (["active", "enabled", "verified", "featured", "is_deal", "show_on_home", "show_in_footer", "show_in_nav"].includes(field)) {
    return <select value={Number(value) ? 1 : 0} onChange={(event) => onChange(Number(event.target.value))}><option value={1}>Yes</option><option value={0}>No</option></select>;
  }
  if (value && typeof value === "object") return <textarea className="json-box" data-key={field} rows={8} defaultValue={JSON.stringify(value, null, 2)} />;
  if (typeof value === "number") return <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
  const text = value ?? "";
  if (wideField(field, text)) return <textarea rows={field === "content" ? 10 : 4} value={text} onChange={(event) => onChange(event.target.value)} />;
  return <input value={text} onChange={(event) => onChange(event.target.value)} />;
}
