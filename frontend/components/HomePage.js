"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { api, pkr } from "../lib/format";
import { useCart } from "../context/CartContext";

export default function HomePage({ data }) {
  const sections = Object.fromEntries((data.sections || []).map((row) => [row.section_key, row.payload]));
  const products = data.products || [];
  const categories = (data.categories || []).filter((row) => row.show_on_home);
  const [filter, setFilter] = useState("All");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const { add } = useCart();
  const featured = products.filter((row) => row.featured);
  const shown = featured.filter((row) => {
    const tags = String(row.tags || "");
    if (filter === "Boys") return row.gender === "boys";
    if (filter === "Girls") return row.gender === "girls";
    if (filter === "STEM") return row.category_slug === "stem" || /science|robot|stem/.test(tags);
    return true;
  });
  const deals = products.filter((row) => row.is_deal);
  const heroDeal = deals.find((row) => row.slug === sections.deals?.hero_slug) || deals[0];
  const boys = products.filter((row) => row.gender === "boys").slice(0, 4);
  const girls = products.filter((row) => row.gender === "girls").slice(0, 4);
  const reviews = (data.reviews || []).slice(0, 3);
  const posts = (data.posts || []).slice(0, 3);

  async function subscribe(event) {
    event.preventDefault();
    try {
      await api("/api/newsletter", { method: "POST", body: { email } });
      setNote("You are on the list. Watch your inbox for the welcome code WELCOME10.");
      setEmail("");
    } catch (err) {
      setNote(err.message);
    }
  }

  return (
    <>
      {sections.hero ? <Hero hero={sections.hero} /> : null}
      {sections.marquee ? <Marquee items={sections.marquee.items || []} /> : null}

      {sections.shop_categories ? (
        <section id="shop" style={{ background: "linear-gradient(180deg,#FFFDF7,#F0FAFF)" }}>
          <SectionHead kicker={sections.shop_categories.label} kickerBg="#FFF3E0" kickerColor="var(--orange)" title={sections.shop_categories.title} subtitle={sections.shop_categories.subtitle} action={<Link className="btn btn-outline" href="/search">{sections.shop_categories.button} →</Link>} />
          <div className="cat-grid">
            {categories.map((row) => (
              <Link key={row.slug} href={`/shop/${row.slug}`} className={`cat-card ${row.color}`}>
                {row.count_label ? <span className="cat-count">{row.count_label}</span> : null}
                <span className="cat-emoji">{row.emoji}</span>
                <h3>{row.name}</h3>
                <p>{row.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sections.featured ? (
        <section id="featured" style={{ background: "white" }}>
          <SectionHead kicker={sections.featured.label} kickerBg="#E8FFF0" kickerColor="var(--green)" title={sections.featured.title} subtitle={sections.featured.subtitle} action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", "Boys", "Girls", "STEM"].map((name) => (
                <button type="button" key={name} className={`filter-tag ${filter === name ? "on" : ""} ${name === "Boys" ? "blue" : ""} ${name === "Girls" ? "pink" : ""} ${name === "STEM" ? "green" : ""}`} onClick={() => setFilter(name)}>{name}</button>
              ))}
            </div>
          } />
          {shown.length ? (
            <div className="product-grid">
              {shown.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty"><div className="big">🧸</div><h2 className="sec-head">Nothing in {filter} right now</h2><p className="sec-sub">Try another tab, or browse the full shop.</p></div>
          )}
        </section>
      ) : null}

      {sections.deals && heroDeal ? (
        <section id="deals" className="deal-section">
          <div className="sec-header" style={{ marginBottom: 40 }}>
            <span className="sec-label" style={{ background: "rgba(255,215,0,.15)", color: "var(--yellow)" }}>🔥 {sections.deals.label}</span>
            <h2 className="sec-head" style={{ color: "white" }}>{sections.deals.title}</h2>
            <p className="sec-sub" style={{ color: "rgba(255,255,255,.6)" }}>{sections.deals.subtitle}</p>
          </div>
          <div className="deal-grid">
            <div>
              <Countdown />
              <div style={{ marginBottom: 28 }}>
                {deals.map((product) => (
                  <Link key={product.id} href={`/product/${product.slug}`} className="deal-mini">
                    <span className="deal-mini-emoji">{product.emoji}</span>
                    <div>
                      <p>{product.name}</p>
                      <small>{product.age_label} · {product.stock} left</small>
                    </div>
                    <span className="price">{pkr(product.price)}</span>
                  </Link>
                ))}
              </div>
              <Link className="btn btn-yellow" href="/shop/sale">⚡ Shop All Deals</Link>
            </div>
            <div className="deal-product">
              <span className="deal-emoji">{heroDeal.emoji}</span>
              <h3>{heroDeal.name}</h3>
              <p>{heroDeal.description}</p>
              <div className="deal-price-row">
                {heroDeal.compare_price ? <span className="deal-old">{pkr(heroDeal.compare_price)}</span> : null}
                <span className="deal-price">{pkr(heroDeal.price)}</span>
                {heroDeal.compare_price ? <span className="deal-save">Save {Math.round((1 - heroDeal.price / heroDeal.compare_price) * 100)}%</span> : null}
              </div>
              <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 18 }}>
                <div style={{ height: 6, background: "rgba(255,255,255,.15)", borderRadius: 3 }}><div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg,var(--yellow),var(--orange))", borderRadius: 3 }} /></div>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 700, marginTop: 8 }}>⚡ {heroDeal.sold} sold · Only {heroDeal.stock} left!</p>
              </div>
              <button className="btn btn-yellow" type="button" style={{ width: "100%", justifyContent: "center" }} disabled={Number(heroDeal.stock) <= 0} onClick={() => add(heroDeal)}>{Number(heroDeal.stock) <= 0 ? "Sold Out" : `🛒 Add to Cart — ${pkr(heroDeal.price)}`}</button>
            </div>
          </div>
        </section>
      ) : null}

      {sections.promos ? (
        <div className="promo-row" style={{ padding: "48px 0", background: "var(--bg)" }}>
          {sections.promos.cards.map((card) => (
            <div key={card.title} className={`promo-card ${card.theme}`}>
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <Link className="btn" style={{ background: "rgba(255,255,255,.2)", color: "white", border: "1.5px solid rgba(255,255,255,.3)" }} href={card.href}>Learn More →</Link>
              </div>
              <div className="promo-tag">{card.tag}<small>{card.tag_small}</small></div>
            </div>
          ))}
        </div>
      ) : null}

      {sections.gender ? (
        <section id="boys" style={{ background: "linear-gradient(180deg,#EEF4FF,#FFFDF7)" }}>
          <div className="gender-hero">
            <GenderPanel tone="boys" data={sections.gender.boys} />
            <GenderPanel tone="girls" data={sections.gender.girls} />
          </div>
          {sections.boys_picks ? (
            <>
              <SectionHead kicker={sections.boys_picks.label} kickerBg="#E8F0FF" kickerColor="var(--blue)" title={sections.boys_picks.title} action={<Link className="btn btn-outline" href="/shop/boys-toys">View All →</Link>} />
              <div className="product-grid">{boys.map((product) => <ProductCard key={product.id} product={product} />)}</div>
            </>
          ) : null}
        </section>
      ) : null}

      {sections.girls_picks ? (
        <section id="girls" style={{ background: "linear-gradient(180deg,#FFF0F7,#FFFDF7)" }}>
          <SectionHead kicker={sections.girls_picks.label} kickerBg="#FFE8F3" kickerColor="var(--pink)" title={sections.girls_picks.title} action={<Link className="btn btn-outline" style={{ borderColor: "var(--pink)", color: "var(--pink)" }} href="/shop/girls-toys">View All →</Link>} />
          <div className="product-grid">{girls.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      ) : null}

      {sections.ages ? (
        <section id="age" style={{ background: "white" }}>
          <div className="sec-header" style={{ textAlign: "center" }}>
            <span className="sec-label" style={{ background: "#FFF3E0", color: "var(--orange)" }}>🎂 {sections.ages.label}</span>
            <h2 className="sec-head">{sections.ages.title}</h2>
            <p className="sec-sub">{sections.ages.subtitle}</p>
          </div>
          <div className="age-timeline">
            {sections.ages.steps.map((step) => {
              const count = products.filter((row) => row.age_max >= step.min && row.age_min <= step.max).length;
              return (
                <Link key={step.key} href={`/shop/by-age?age=${step.key}`} className="age-step">
                  <div className="age-dot" style={{ background: step.color }} />
                  <span className="age-emoji">{step.emoji}</span>
                  <div className="age-range" style={{ color: step.color }}>{step.range}</div>
                  <div className="age-desc">{step.desc}</div>
                  <span className="age-count">{count} toys</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {sections.stem ? (
        <section id="stem" style={{ background: "linear-gradient(180deg,#F2EFFF,#FFFDF7)" }}>
          <SectionHead kicker={sections.stem.label} kickerBg="#F0E8FF" kickerColor="var(--purple)" title={sections.stem.title} subtitle={sections.stem.subtitle} action={<Link className="btn btn-outline" style={{ borderColor: "var(--purple)", color: "var(--purple)" }} href="/shop/stem">Explore All →</Link>} />
          <div className="stem-grid">
            {sections.stem.cards.map((card) => (
              <Link key={card.title} href={card.href} className={`stem-card ${card.theme}`}>
                <div className="stem-bg">{card.emoji}</div>
                <div className="stem-body">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <span className="stem-cta">Shop Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sections.brands ? (
        <section className="band" style={{ background: "white" }}>
          <div className="sec-header" style={{ textAlign: "center", marginBottom: 32 }}>
            <span className="sec-label" style={{ background: "#F5F5F0", color: "#888" }}>🏷️ {sections.brands.label}</span>
            <h2 className="sec-head">{sections.brands.title}</h2>
          </div>
          <div className="brands-track">
            <div className="brands-inner">
              {[...sections.brands.items, ...sections.brands.items].map((brand, index) => <div className="brand-pill" key={`${brand}-${index}`}>{brand}</div>)}
            </div>
          </div>
        </section>
      ) : null}

      <Recent products={products} title={sections.recent?.title || "Still Thinking?"} label={sections.recent?.label || "Recently Viewed"} />

      {sections.why ? (
        <section className="features-bg">
          <div className="sec-header" style={{ textAlign: "center" }}>
            <span className="sec-label" style={{ background: "#E8FFF0", color: "var(--green)" }}>💚 {sections.why.label}</span>
            <h2 className="sec-head">{sections.why.title}</h2>
            <p className="sec-sub">{sections.why.subtitle}</p>
          </div>
          <div className="feat-grid">
            {sections.why.cards.map((card) => (
              <div className="feat-card" key={card.title}>
                <div className="feat-icon-wrap" style={{ background: card.bg }}>{card.icon}</div>
                <h4>{card.title}</h4>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {sections.reviews_header ? (
        <section style={{ background: "linear-gradient(135deg,#FFF5E0,#E8F8FF)" }}>
          <div className="sec-header" style={{ textAlign: "center" }}>
            <span className="sec-label" style={{ background: "white", color: "var(--orange)" }}>💬 {sections.reviews_header.label}</span>
            <h2 className="sec-head">{sections.reviews_header.title}</h2>
            <p className="sec-sub">{sections.reviews_header.subtitle}</p>
          </div>
          <div className="testi-grid">
            {reviews.map((review) => (
              <article className="testi-card" key={review.id}>
                <div className="testi-stars">{"★".repeat(review.stars)}</div>
                <p className="testi-text">"{review.text}"</p>
                <div className="testi-author">
                  <div className="tavi" style={{ background: "#FFF3E0" }}>{review.avatar}</div>
                  <div>
                    <div className="tname">{review.author}</div>
                    <div className="trole">{review.role} · {review.city}</div>
                    {review.verified ? <div className="tverified">✔ Verified Purchase</div> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: "28px 32px", marginTop: 32, display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap", boxShadow: "0 4px 16px rgba(0,0,0,.07)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Fredoka One,cursive", fontSize: 64, color: "var(--orange)" }}>{sections.reviews_header.score}</div>
              <div style={{ color: "var(--yellow)", fontSize: 22 }}>★★★★★</div>
              <div style={{ fontSize: 13, color: "#999", fontWeight: 700, marginTop: 4 }}>{sections.reviews_header.based_on}</div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              {(sections.reviews_header.bars || []).map((bar) => (
                <div key={bar.star} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 32 }}>{bar.star} ★</span>
                  <div style={{ flex: 1, height: 8, background: "#F3F0EA", borderRadius: 8 }}><div style={{ width: `${bar.width}%`, height: "100%", background: "var(--yellow)", borderRadius: 8 }} /></div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(sections.reviews_header.metrics || []).map((metric) => <div key={metric} style={{ fontSize: 14, fontWeight: 700 }}>{metric}</div>)}
            </div>
          </div>
        </section>
      ) : null}

      {sections.blog_header ? (
        <section style={{ background: "white" }}>
          <SectionHead kicker={sections.blog_header.label} kickerBg="#FFF3E0" kickerColor="var(--orange)" title={sections.blog_header.title} subtitle={sections.blog_header.subtitle} action={<Link className="btn btn-outline" href="/blog">All Articles →</Link>} />
          <div className="blog-grid">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-thumb" style={{ background: post.gradient }}>{post.emoji}</div>
                <div className="blog-body">
                  <div className="blog-cat">{post.category}</div>
                  <div className="blog-title">{post.title}</div>
                  <div className="blog-excerpt">{post.excerpt}</div>
                  <div className="blog-meta"><span>{post.author}</span><span>{post.published_at?.slice(0, 7)} · {post.read_time}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sections.app_banner ? (
        <section className="app-section">
          <div className="app-text">
            <span className="sec-label" style={{ background: "rgba(255,215,0,.15)", color: "var(--yellow)" }}>📱 {sections.app_banner.label}</span>
            <h2 className="sec-head" style={{ color: "white" }}>{sections.app_banner.title}</h2>
            <p>{sections.app_banner.text}</p>
            <div className="app-btns">
              <div className="app-store-btn"><div className="asb-icon">🍎</div><div className="asb-text"><div className="asb-sub">Download on</div><div className="asb-name">App Store</div></div></div>
              <div className="app-store-btn"><div className="asb-icon">🤖</div><div className="asb-text"><div className="asb-sub">Get it on</div><div className="asb-name">Google Play</div></div></div>
            </div>
          </div>
          <div className="app-mockup"><div className="phone-frame">📱</div><div className="phone-frame">🛍️</div></div>
        </section>
      ) : null}

      {sections.newsletter ? (
        <section className="nl-section">
          <h2>🎁 {sections.newsletter.title}</h2>
          <p>{sections.newsletter.text}</p>
          <div className="nl-perks">{(sections.newsletter.perks || []).map((perk) => <span className="nl-perk" key={perk}>{perk}</span>)}</div>
          <form className="nl-form" onSubmit={subscribe}>
            <input type="email" required placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} />
            <button className="btn btn-dark" type="submit">Subscribe 🎉</button>
          </form>
          {note ? <p style={{ marginTop: 14 }}>{note}</p> : null}
        </section>
      ) : null}
    </>
  );
}

function Hero({ hero }) {
  return (
    <section className="hero">
      <div>
        <span className="hero-badge">🌟 {hero.badge}</span>
        <h1>
          {(hero.lines || []).map((line) => <span key={line.text}><span className={line.color}>{line.text}</span><br /></span>)}
        </h1>
        <p className="hero-sub">{hero.subtitle}</p>
        <div className="hero-btns">
          <Link href={hero.primary_href || "/shop/boys-toys"} className="btn btn-orange" style={{ fontSize: 16, padding: "14px 32px" }}>🛍️ {hero.primary_label}</Link>
          <Link href={hero.secondary_href || "/shop/sale"} className="btn btn-outline" style={{ fontSize: 16, padding: "14px 28px" }}>🔥 {hero.secondary_label}</Link>
        </div>
        <div className="hero-stats">
          {(hero.stats || []).map((stat) => (
            <div className="stat-item" key={stat.label}><div className="stat-num">{stat.num}</div><div className="stat-lbl">{stat.label}</div></div>
          ))}
        </div>
      </div>
      <div className="hero-right">
        <div className="hero-circle"><span className="hero-main-toy">{hero.toy || "🧸"}</span></div>
        {(hero.chips || []).map((chip, index) => (
          <div key={chip.label} className={`float-chip fc${index + 1}`}><span className="fc-emoji">{chip.emoji}</span><span>{chip.label}</span></div>
        ))}
      </div>
    </section>
  );
}

function Marquee({ items }) {
  const loop = [...items, ...items];
  return (
    <div className="marquee-wrap">
      <div className="marquee">
        {loop.map((item, index) => <span key={`${item}-${index}`}>{item}<span className="dot"> ✦ </span></span>)}
      </div>
    </div>
  );
}

function SectionHead({ kicker, kickerBg, kickerColor, title, subtitle, action }) {
  return (
    <div className="sec-header-row sec-header">
      <div>
        <span className="sec-label" style={{ background: kickerBg, color: kickerColor }}>{kicker}</span>
        <h2 className="sec-head">{title}</h2>
        {subtitle ? <p className="sec-sub">{subtitle}</p> : null}
      </div>
      {action || null}
    </div>
  );
}

function GenderPanel({ tone, data }) {
  if (!data) return null;
  return (
    <div className={`gh-panel ${tone === "boys" ? "gh-boys" : "gh-girls"}`}>
      <div className="gh-emojis">{data.emojis}</div>
      <span className="sec-label" style={{ background: tone === "boys" ? "rgba(59,111,232,.1)" : "rgba(232,0,110,.1)", color: tone === "boys" ? "var(--blue)" : "var(--pink)" }}>{data.label}</span>
      <h2>{data.title}</h2>
      <p>{data.text}</p>
      <div className="gh-tags">{(data.tags || []).map((tag) => <span className="gh-tag" key={tag}>{tag}</span>)}</div>
      <Link href={data.href} className={`btn ${tone === "boys" ? "btn-teal" : "btn-pink"}`}>Shop {tone === "boys" ? "Boys" : "Girls"} →</Link>
    </div>
  );
}

function Countdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => {
      const shifted = Date.now() + 5 * 60 * 60 * 1000;
      setLeft(86400000 - (shifted % 86400000));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  const parts = useMemo(() => {
    const total = Math.floor(left / 1000);
    return {
      h: String(Math.floor(total / 3600)).padStart(2, "0"),
      m: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
      s: String(total % 60).padStart(2, "0"),
    };
  }, [left]);
  return (
    <div className="countdown">
      <Box n={parts.h} label="Hours" />
      <span className="cd-sep">:</span>
      <Box n={parts.m} label="Mins" />
      <span className="cd-sep">:</span>
      <Box n={parts.s} label="Secs" />
    </div>
  );
}

function Box({ n, label }) {
  return <div className="cd-box"><div className="cd-num">{n}</div><div className="cd-lbl">{label}</div></div>;
}

function Recent({ products, title, label }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("kidlo_recent") || "[]");
    const mapped = ids.map((id) => products.find((row) => row.id === id)).filter(Boolean);
    setItems(mapped.length ? mapped : products.slice(0, 6));
  }, [products]);
  if (!items.length) return null;
  return (
    <section className="band" style={{ background: "var(--light)" }}>
      <SectionHead kicker={label} kickerBg="white" kickerColor="#888" title={title} />
      <div className="rv-strip">
        {items.slice(0, 6).map((product) => (
          <Link key={product.id} href={`/product/${product.slug}`} className="rv-item">
            <span className="rv-emoji">{product.emoji}</span>
            <p>{product.name}</p>
            <span>{pkr(product.price)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
