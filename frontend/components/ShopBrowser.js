"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import { api } from "../lib/format";

const PRICES = [
  { label: "Any price", min: "", max: "" },
  { label: "Under 500", min: 0, max: 500 },
  { label: "Under 1,000", min: 0, max: 1000 },
  { label: "Under 2,000", min: 0, max: 2000 },
  { label: "Under 3,000", min: 0, max: 3000 },
  { label: "Under 5,000", min: 0, max: 5000 },
  { label: "Premium", min: 5000, max: "" },
];

export default function ShopBrowser({ slug = "", initialQuery = "" }) {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const age = params.get("age") || "";
  const q = params.get("q") || initialQuery;
  const sort = params.get("sort") || "featured";
  const min = params.get("min") || "";
  const max = params.get("max") || "";

  useEffect(() => {
    const search = new URLSearchParams();
    if (slug) search.set("slug", slug);
    if (q) search.set("q", q);
    if (age) search.set("age", age);
    if (sort) search.set("sort", sort);
    if (min) search.set("min", min);
    if (max) search.set("max", max);
    api(`/api/catalog?${search.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [slug, q, age, sort, min, max]);

  function push(next) {
    const search = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === "" || value === undefined) search.delete(key);
      else search.set(key, value);
    });
    const path = slug ? `/shop/${slug}` : "/search";
    router.push(`${path}?${search.toString()}`);
  }

  if (error) return <section className="page-body"><p>{error}</p></section>;
  if (!data) return <section className="page-body"><p className="muted">Loading toys…</p></section>;
  const title = data.category?.name || (q ? `Search: ${q}` : "All Toys");
  const ages = [
    ["", "All ages"],
    ["0-2", "0–2"],
    ["3-5", "3–5"],
    ["6-8", "6–8"],
    ["9-11", "9–11"],
    ["12-14", "12–14"],
    ["15-99", "15+"],
  ];

  return (
    <>
      <div className="page-hero">
        <div className="crumb"><Link href="/">Home</Link> / {title}</div>
        <h1>{data.category?.emoji ? `${data.category.emoji} ` : ""}{title}</h1>
        <p className="sec-sub">{data.category?.blurb || "Safe, age-labelled toys with delivery across Pakistan."}</p>
      </div>
      <div className="page-body">
        <div className="toolbar">
          <select value={sort} onChange={(event) => push({ sort: event.target.value })}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="rating">Top rated</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <select value={age} onChange={(event) => push({ age: event.target.value })}>
            {ages.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
          </select>
          <select value={`${min}|${max}`} onChange={(event) => {
            const [nextMin, nextMax] = event.target.value.split("|");
            push({ min: nextMin, max: nextMax });
          }}>
            {PRICES.map((band) => <option key={band.label} value={`${band.min}|${band.max}`}>{band.label}</option>)}
          </select>
          <span className="muted">{data.products.length} toys</span>
        </div>
        {slug === "by-age" ? (
          <div className="filter-bar">
            {ages.filter(([value]) => value).map(([value, label]) => (
              <button key={value} className={`filter-tag ${age === value ? "on" : ""}`} onClick={() => push({ age: value })}>{label}</button>
            ))}
          </div>
        ) : null}
        {data.products.length ? (
          <div className="product-grid">{data.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="empty"><div className="big">🔍</div><h2 className="sec-head">No toys in this filter</h2><p className="sec-sub">Try another age or price.</p></div>
        )}
      </div>
    </>
  );
}
