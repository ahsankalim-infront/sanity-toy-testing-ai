"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import { api, pkr } from "../../../lib/format";

const blank = {
  slug: "", name: "", emoji: "🧸", image_url: "", image_alt: "", category_slug: "boys-toys", gender: "all", age_min: 3, age_max: 8,
  age_label: "All · 3–8 yrs", price: 1999, compare_price: 0, badge: "", rating: 5, review_count: 0,
  stock: 10, sold: 0, description: "", gradient: "linear-gradient(135deg,#FFF3E0,#FFE0C0)", brand: "Kidlo",
  sku: "", tags: "", featured: 0, is_deal: 0, active: 1,
};

export default function ProductsAdmin() {
  const products = useAdminRows("products");
  const categories = useAdminRows("categories");
  const media = useAdminRows("media_files");
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [note, setNote] = useState("");
  const [showMedia, setShowMedia] = useState(false);

  const filtered = useMemo(() => products.rows.filter((row) => {
    const text = `${row.name} ${row.sku} ${row.slug}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (category === "all" || row.category_slug === category);
  }), [products.rows, query, category]);

  function start(row = blank) {
    setDraft(JSON.parse(JSON.stringify(row)));
    setShowMedia(false);
    setNote("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function set(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function setName(name) {
    setDraft((current) => ({
      ...current,
      name,
      slug: current.id || current.slug ? current.slug : slugify(name),
      image_alt: current.image_alt || name,
    }));
  }

  async function save(event) {
    event.preventDefault();
    setNote("");
    try {
      const method = draft.id ? "PUT" : "POST";
      const path = draft.id ? `/api/admin/products/${draft.id}` : "/api/admin/products";
      await api(path, { method, headers: adminHeaders(), body: draft });
      await products.reload();
      setDraft(null);
      setNote("Product saved successfully.");
    } catch (err) {
      setNote(err.message);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete ${row.name}?`)) return;
    try {
      await api(`/api/admin/products/${row.id}`, { method: "DELETE", headers: adminHeaders() });
      await products.reload();
      setNote("Product deleted.");
    } catch (err) {
      setNote(err.message);
    }
  }

  function chooseImage(row) {
    setDraft((current) => ({ ...current, image_url: row.url, image_alt: current.image_alt || row.alt_text || current.name }));
    setShowMedia(false);
  }

  return (
    <>
      <div className="admin-top products-admin-head">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Products</h1>
          <p className="muted">Manage catalogue details, stock, pricing, and product media.</p>
        </div>
        <div className="row-actions">
          <Link className="btn btn-outline" href="/admin/media">🖼️ Media library</Link>
          <button className="btn btn-orange" type="button" onClick={() => start()}>+ Add product</button>
        </div>
      </div>
      {note ? <p className="note">{note}</p> : null}
      {products.error ? <p className="note">{products.error}</p> : null}

      {draft ? (
        <form className="product-editor" onSubmit={save}>
          <header className="product-editor-head">
            <div><span>{draft.id ? `Product #${draft.id}` : "New product"}</span><h2>{draft.name || "Untitled product"}</h2></div>
            <div className="row-actions"><button className="btn btn-outline" type="button" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-orange" type="submit">Save product</button></div>
          </header>

          <div className="product-editor-grid">
            <div className="product-editor-main">
              <section className="admin-panel">
                <h3>Product information</h3>
                <div className="field"><label>Product name</label><input required value={draft.name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Wooden Rainbow Stacker" /></div>
                <div className="form-grid">
                  <div className="field"><label>URL slug</label><input required value={draft.slug} onChange={(event) => set("slug", slugify(event.target.value))} /></div>
                  <div className="field"><label>SKU</label><input value={draft.sku} onChange={(event) => set("sku", event.target.value.toUpperCase())} placeholder="KID-0001" /></div>
                </div>
                <div className="field"><label>Description</label><textarea required rows={5} value={draft.description} onChange={(event) => set("description", event.target.value)} placeholder="Explain the play value, materials, and what is included." /></div>
                <div className="form-grid">
                  <div className="field"><label>Brand</label><input value={draft.brand} onChange={(event) => set("brand", event.target.value)} /></div>
                  <div className="field"><label>Search tags</label><input value={draft.tags} onChange={(event) => set("tags", event.target.value)} placeholder="stem,science,learning" /></div>
                </div>
              </section>

              <section className="admin-panel">
                <h3>Pricing and inventory</h3>
                <div className="admin-field-grid three">
                  <NumberField label="Price (PKR)" value={draft.price} onChange={(value) => set("price", value)} min={0} />
                  <NumberField label="Compare price" value={draft.compare_price} onChange={(value) => set("compare_price", value)} min={0} />
                  <NumberField label="Stock" value={draft.stock} onChange={(value) => set("stock", value)} min={0} />
                  <NumberField label="Units sold" value={draft.sold} onChange={(value) => set("sold", value)} min={0} />
                  <NumberField label="Rating" value={draft.rating} onChange={(value) => set("rating", value)} min={0} step="0.1" />
                  <NumberField label="Review count" value={draft.review_count} onChange={(value) => set("review_count", value)} min={0} />
                </div>
              </section>

              <section className="admin-panel">
                <h3>Classification</h3>
                <div className="admin-field-grid three">
                  <div className="field"><label>Category</label><select value={draft.category_slug} onChange={(event) => set("category_slug", event.target.value)}>{categories.rows.filter((row) => row.active).map((row) => <option key={row.slug} value={row.slug}>{row.name}</option>)}</select></div>
                  <div className="field"><label>Gender</label><select value={draft.gender} onChange={(event) => set("gender", event.target.value)}><option value="all">All</option><option value="boys">Boys</option><option value="girls">Girls</option></select></div>
                  <div className="field"><label>Badge</label><select value={draft.badge} onChange={(event) => set("badge", event.target.value)}><option value="">None</option><option value="new">New</option><option value="hot">Hot</option><option value="sale">Sale</option></select></div>
                  <NumberField label="Minimum age" value={draft.age_min} onChange={(value) => set("age_min", value)} min={0} />
                  <NumberField label="Maximum age" value={draft.age_max} onChange={(value) => set("age_max", value)} min={0} />
                  <div className="field"><label>Age label</label><input value={draft.age_label} onChange={(event) => set("age_label", event.target.value)} /></div>
                </div>
              </section>
            </div>

            <aside className="product-editor-side">
              <section className="admin-panel product-media-panel">
                <h3>Product image</h3>
                <div className={`product-admin-preview ${draft.image_url ? "has-photo" : ""}`} style={{ background: draft.gradient }}>
                  {draft.image_url ? <img src={draft.image_url} alt={draft.image_alt || draft.name} /> : <span>{draft.emoji || "🧸"}</span>}
                </div>
                <p className="admin-help">When an image is selected, the storefront automatically hides the emoji. The emoji is only a fallback.</p>
                <button className="btn btn-outline media-choose-button" type="button" onClick={() => setShowMedia((value) => !value)}>{showMedia ? "Close library" : "Choose from media library"}</button>
                {showMedia ? (
                  <div className="product-media-picker">
                    {media.rows.length ? [...media.rows].reverse().map((row) => (
                      <button type="button" key={row.id} className={row.url === draft.image_url ? "selected" : ""} onClick={() => chooseImage(row)}>
                        <img src={row.url} alt={row.alt_text || row.file_name} /><span>{row.alt_text || row.file_name}</span>
                      </button>
                    )) : <p>No images yet. Upload one in the Media library.</p>}
                  </div>
                ) : null}
                <div className="field"><label>Image URL</label><input value={draft.image_url} onChange={(event) => set("image_url", event.target.value)} placeholder="/api/media/products/image.webp" /></div>
                <div className="field"><label>Image alt text</label><input value={draft.image_alt} onChange={(event) => set("image_alt", event.target.value)} placeholder="Describe the product image" /></div>
                {draft.image_url ? <button className="text-btn" type="button" onClick={() => set("image_url", "")}>Remove image and use emoji</button> : null}
                <div className="form-grid compact-fields">
                  <div className="field"><label>Fallback emoji</label><input value={draft.emoji} onChange={(event) => set("emoji", event.target.value)} /></div>
                  <div className="field"><label>Background</label><input value={draft.gradient} onChange={(event) => set("gradient", event.target.value)} /></div>
                </div>
              </section>

              <section className="admin-panel">
                <h3>Publishing</h3>
                <Toggle label="Active in store" checked={draft.active} onChange={(value) => set("active", value)} />
                <Toggle label="Featured product" checked={draft.featured} onChange={(value) => set("featured", value)} />
                <Toggle label="Include in deals" checked={draft.is_deal} onChange={(value) => set("is_deal", value)} />
              </section>
            </aside>
          </div>
        </form>
      ) : null}

      <div className="product-admin-toolbar">
        <div className="nav-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, or slug" /></div>
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.rows.map((row) => <option key={row.slug} value={row.slug}>{row.name}</option>)}</select>
        <span>{filtered.length} products</span>
      </div>

      <div className="product-admin-list">
        {filtered.map((row) => (
          <article key={row.id} className="product-admin-row">
            <div className={`product-admin-thumb ${row.image_url ? "has-photo" : ""}`} style={{ background: row.gradient }}>{row.image_url ? <img src={row.image_url} alt={row.image_alt || row.name} /> : <span>{row.emoji}</span>}</div>
            <div className="product-admin-name"><strong>{row.name}</strong><span>{row.sku || "No SKU"} · {row.category_slug}</span></div>
            <div><span className="admin-cell-label">Price</span><strong>{pkr(row.price)}</strong></div>
            <div><span className="admin-cell-label">Stock</span><strong className={row.stock <= 0 ? "stock-empty" : ""}>{row.stock}</strong></div>
            <div><span className={`pill ${row.active ? "good" : "bad"}`}>{row.active ? "Active" : "Draft"}</span></div>
            <div className="row-actions"><button className="btn btn-outline" type="button" onClick={() => start(row)}>Edit</button><button className="text-btn" type="button" onClick={() => remove(row)}>Delete</button></div>
          </article>
        ))}
      </div>
    </>
  );
}

function NumberField({ label, value, onChange, min, step = "1" }) {
  return <div className="field"><label>{label}</label><input type="number" min={min} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function Toggle({ label, checked, onChange }) {
  return <label className="admin-toggle"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked ? 1 : 0)} /><span /><b>{label}</b></label>;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
