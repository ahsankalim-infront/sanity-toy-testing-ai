const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const multer = require("multer");
const { DualStore } = require("./store");
const { buildSeed, hashPassword, verifyPassword } = require("./seed");
const { demoOrders } = require("./demo");
const { buildPlaces } = require("./places");

const HERO_IMAGES = [
  { src: "/hero/teddy.jpg", label: "Rainbow Teddy" },
  { src: "/hero/rccar.jpg", label: "Turbo RC Car" },
  { src: "/hero/robot.jpg", label: "Coding Robot" },
  { src: "/hero/unicorn.jpg", label: "Unicorn Plush" },
];

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim();
  }
}

const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || "kidlo-dev-secret";
const store = new DualStore();
const UPLOAD_ROOT = process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join("/tmp", "kidlo-uploads") : path.join(__dirname, "..", "uploads"));
const PRODUCT_UPLOAD_DIR = path.join(UPLOAD_ROOT, "products");
fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const uploadProductImage = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, done) => done(null, PRODUCT_UPLOAD_DIR),
    filename: (_req, file, done) => {
      const base = path.basename(file.originalname, path.extname(file.originalname))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 50) || "product";
      done(null, `${base}-${crypto.randomUUID().slice(0, 8)}${IMAGE_TYPES[file.mimetype] || ""}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!IMAGE_TYPES[file.mimetype]) return done(new Error("Upload a JPG, PNG, WebP, or GIF image"));
    done(null, true);
  },
});

const PUBLIC_TABLES = ["categories", "products", "sections", "pages", "blog_posts", "reviews", "coupons"];
const ADMIN_TABLES = [...PUBLIC_TABLES, "orders", "order_items", "customers", "newsletter", "inquiries", "admins", "countries", "cities", "seo_entries", "media_files"];

function sign(payload, days = 7) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + days * 86400000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function readToken(header) {
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (data.exp < Date.now()) return null;
  return data;
}

function stripSecrets(rows) {
  return rows.map((row) => {
    const copy = { ...row };
    delete copy.password_hash;
    return copy;
  });
}

function sectionMap() {
  return Object.fromEntries(store.all("sections").map((row) => [row.section_key, row]));
}

function activeProducts() {
  return store.all("products").filter((row) => row.active);
}

function productsForCategory(category) {
  const categories = store.all("categories");
  const products = activeProducts();
  if (!category) return products;
  if (category.slug === "by-age") return products;
  if (category.virtual === "badge") return products.filter((row) => row.badge === category.virtual_value);
  if (category.virtual === "deal") return products.filter((row) => row.is_deal || (row.compare_price && row.compare_price > row.price));
  if (category.filter_tag) {
    const tag = category.filter_tag;
    return products.filter((row) => String(row.tags || "").split(",").map((item) => item.trim()).includes(tag));
  }
  const slugs = new Set([category.slug, ...categories.filter((row) => row.parent_slug === category.slug).map((row) => row.slug)]);
  if (category.slug === "boys-toys" || category.slug === "girls-toys") {
    const gender = category.slug === "boys-toys" ? "boys" : "girls";
    return products.filter((row) => row.gender === gender || slugs.has(row.category_slug));
  }
  return products.filter((row) => slugs.has(row.category_slug));
}

function publicHome() {
  return {
    ...store.status(),
    sections: store.all("sections").filter((row) => row.enabled),
    categories: store.all("categories").filter((row) => row.active),
    products: activeProducts(),
    reviews: store.all("reviews").filter((row) => row.enabled),
    posts: store.all("blog_posts").filter((row) => row.enabled),
  };
}

function requireAdmin(req, res, next) {
  const user = readToken(req.headers.authorization);
  if (!user || user.role !== "admin") return res.status(401).json({ error: "Admin login required" });
  req.user = user;
  next();
}

function digits(value) {
  return String(value || "").replace(/\D/g, "").replace(/^92/, "0");
}

function normalizeSeoPath(value) {
  let pathValue = String(value || "/").trim();
  if (!pathValue.startsWith("/")) pathValue = `/${pathValue}`;
  return pathValue.length > 1 ? pathValue.replace(/\/+$/, "") : pathValue;
}

function nationalNumber(raw, country) {
  let value = String(raw || "").replace(/\D/g, "");
  const dial = String(country.dial || "").replace(/\D/g, "");
  if (dial && value.startsWith(dial) && value.length > Number(country.digits)) value = value.slice(dial.length);
  value = value.replace(/^0+/, "");
  return value;
}

async function upgradeData() {
  const hero = store.all("sections").find((row) => row.section_key === "hero");
  if (hero && !Array.isArray(hero.payload?.images)) {
    await store.update("sections", hero.id, { payload: { ...hero.payload, images: HERO_IMAGES } });
  }
  if (!store.all("countries").length) {
    const places = buildPlaces();
    store.data.countries = places.countries;
    store.data.cities = places.cities;
    await store.persist("countries");
    await store.persist("cities");
  }
  const orders = store.all("orders");
  if (orders.some((row) => !row.country_code)) {
    store.data.orders = orders.map((row) => (row.country_code ? row : { ...row, country_code: "PK", country_name: "Pakistan", dial_code: "+92" }));
    await store.persist("orders");
  }
  const seededSeo = buildSeed().seo_entries;
  const currentSeo = store.all("seo_entries");
  const knownPaths = new Set(currentSeo.map((row) => row.path));
  const missingSeo = seededSeo.filter((row) => !knownPaths.has(row.path));
  if (missingSeo.length) {
    let nextId = currentSeo.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
    store.data.seo_entries = currentSeo.concat(missingSeo.map((row) => ({ ...row, id: ++nextId })));
    await store.persist("seo_entries");
  }
  if (!store.data.meta.demo_orders && store.all("orders").length <= 1 && process.env.DEMO_ORDERS !== "0") {
    const rules = sectionMap().commerce?.payload || {};
    const demo = demoOrders({ products: activeProducts(), orders: store.all("orders"), orderItems: store.all("order_items"), rules });
    store.data.orders = store.all("orders").concat(demo.orders);
    store.data.order_items = store.all("order_items").concat(demo.items);
    store.data.meta.demo_orders = demo.orders.length;
    await store.persist("orders");
    await store.persist("order_items");
  }
}

function dayKey(value) {
  const date = new Date(new Date(value).getTime() + 5 * 3600000);
  return date.toISOString().slice(0, 10);
}

function countBy(rows, key, value = () => 1) {
  const map = new Map();
  for (const row of rows) {
    const name = typeof key === "function" ? key(row) : row[key];
    map.set(name || "Unknown", (map.get(name || "Unknown") || 0) + value(row));
  }
  return [...map.entries()].map(([label, total]) => ({ label, value: total })).sort((a, b) => b.value - a.value);
}

function summarize(orders, items, customers) {
  const paid = orders.filter((row) => row.status !== "Cancelled");
  const ids = new Set(paid.map((row) => Number(row.id)));
  const lines = items.filter((row) => ids.has(Number(row.order_id)));
  const revenue = paid.reduce((sum, row) => sum + Number(row.total || 0), 0);
  return {
    revenue,
    orders: orders.length,
    paidOrders: paid.length,
    aov: paid.length ? Math.round(revenue / paid.length) : 0,
    units: lines.reduce((sum, row) => sum + Number(row.qty || 0), 0),
    discounts: paid.reduce((sum, row) => sum + Number(row.discount || 0), 0),
    shipping: paid.reduce((sum, row) => sum + Number(row.shipping || 0), 0),
    cancelled: orders.length - paid.length,
    customers,
  };
}

function buildReport(days) {
  const now = Date.now();
  const start = now - days * 86400000;
  const prevStart = start - days * 86400000;
  const allOrders = store.all("orders");
  const allItems = store.all("order_items");
  const products = store.all("products");
  const categories = store.all("categories");
  const inRange = (row, from, to) => {
    const time = new Date(row.created_at).getTime();
    return time >= from && time < to;
  };
  const orders = allOrders.filter((row) => inRange(row, start, now + 1));
  const previous = allOrders.filter((row) => inRange(row, prevStart, start));
  const newCustomers = store.all("customers").filter((row) => inRange(row, start, now + 1)).length;
  const prevCustomers = store.all("customers").filter((row) => inRange(row, prevStart, start)).length;
  const current = summarize(orders, allItems, newCustomers);
  const before = summarize(previous, allItems, prevCustomers);
  const change = Object.fromEntries(Object.keys(current).map((key) => [key, before[key] ? Math.round(((current[key] - before[key]) / before[key]) * 100) : null]));

  const daily = [];
  const byDay = new Map();
  for (const row of orders) {
    const key = dayKey(row.created_at);
    const entry = byDay.get(key) || { revenue: 0, orders: 0 };
    entry.orders += 1;
    if (row.status !== "Cancelled") entry.revenue += Number(row.total || 0);
    byDay.set(key, entry);
  }
  for (let index = days - 1; index >= 0; index -= 1) {
    const key = dayKey(now - index * 86400000);
    daily.push({ date: key, ...(byDay.get(key) || { revenue: 0, orders: 0 }) });
  }

  const paidIds = new Set(orders.filter((row) => row.status !== "Cancelled").map((row) => Number(row.id)));
  const lines = allItems.filter((row) => paidIds.has(Number(row.order_id)));
  const productMap = new Map(products.map((row) => [Number(row.id), row]));
  const categoryName = new Map(categories.map((row) => [row.slug, row.name]));
  const top = new Map();
  for (const line of lines) {
    const entry = top.get(line.product_id) || { id: line.product_id, name: line.name, emoji: line.emoji, units: 0, revenue: 0 };
    entry.units += Number(line.qty);
    entry.revenue += Number(line.price) * Number(line.qty);
    top.set(line.product_id, entry);
  }

  return {
    ...store.status(),
    days,
    summary: current,
    change,
    daily,
    status: countBy(orders, "status"),
    payments: countBy(orders.filter((row) => row.status !== "Cancelled"), (row) => String(row.payment_method || "").toUpperCase(), (row) => Number(row.total || 0)),
    cities: countBy(orders.filter((row) => row.status !== "Cancelled"), "city", (row) => Number(row.total || 0)).slice(0, 8),
    categories: countBy(lines, (row) => categoryName.get(productMap.get(Number(row.product_id))?.category_slug) || "Other", (row) => Number(row.price) * Number(row.qty)),
    topProducts: [...top.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    lowStock: products.filter((row) => row.active && row.stock <= 10).sort((a, b) => a.stock - b.stock).map((row) => ({ id: row.id, name: row.name, emoji: row.emoji, stock: row.stock, sold: row.sold })),
    recent: [...orders].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8),
    orders: [...orders].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    inquiries: store.all("inquiries").filter((row) => row.status === "new").length,
    newsletter: store.all("newsletter").length,
    pendingSync: (store.data.meta.pending_tables || []).length,
  };
}

async function main() {
  try {
    await store.init();
    await upgradeData();
  } catch (err) {
    console.error(err);
    if (!store.data) store.loadJson();
  }
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/media", express.static(UPLOAD_ROOT, { maxAge: "7d" }));

  app.get("/api/health", async (_req, res) => {
    await store.ensureMysql();
    res.json({ ok: true, ...store.status() });
  });

  app.get("/api/places", (_req, res) => {
    const countries = store.all("countries").filter((row) => row.active).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    const cities = store.all("cities").filter((row) => row.active).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    res.json({ countries, cities });
  });

  app.get("/api/home", (_req, res) => res.json(publicHome()));
  app.get("/api/shell", (_req, res) => {
    const home = publicHome();
    res.json({ ...store.status(), sections: home.sections, categories: home.categories });
  });

  app.get("/api/catalog", (req, res) => {
    const categories = store.all("categories").filter((row) => row.active);
    const slug = String(req.query.slug || "");
    let category = categories.find((row) => row.slug === slug) || null;
    if (slug === "by-age") {
      category = { slug: "by-age", name: "Shop by Age", emoji: "🎂", blurb: "Every stage, every joy", color: "cat-a" };
    } else if (slug && !category) {
      return res.status(404).json({ error: "Category not found" });
    }
    let items = category ? productsForCategory(category) : activeProducts();
    const q = String(req.query.q || "").trim().toLowerCase();
    const gender = String(req.query.gender || "");
    const age = String(req.query.age || "");
    const min = Number(req.query.min || 0);
    const max = Number(req.query.max || 0);
    if (q) {
      items = items.filter((row) => `${row.name} ${row.brand} ${row.tags} ${row.description}`.toLowerCase().includes(q));
    }
    if (gender && gender !== "all") items = items.filter((row) => row.gender === gender || row.gender === "all");
    if (age && age.includes("-")) {
      const [a, b] = age.split("-").map(Number);
      items = items.filter((row) => row.age_max >= a && row.age_min <= b);
    }
    if (min) items = items.filter((row) => row.price >= min);
    if (max) items = items.filter((row) => row.price <= max);
    const sort = String(req.query.sort || "featured");
    const ranked = [...items];
    if (sort === "price_asc") ranked.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") ranked.sort((a, b) => b.price - a.price);
    else if (sort === "rating") ranked.sort((a, b) => b.rating - a.rating);
    else if (sort === "newest") ranked.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    else ranked.sort((a, b) => b.featured - a.featured || b.sold - a.sold);
    res.json({ ...store.status(), category, products: ranked, categories });
  });

  app.get("/api/products/:slug", (req, res) => {
    const product = activeProducts().find((row) => row.slug === req.params.slug);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const related = activeProducts().filter((row) => row.category_slug === product.category_slug && row.id !== product.id).slice(0, 4);
    const reviews = store.all("reviews").filter((row) => row.enabled && Number(row.product_id) === Number(product.id));
    res.json({ product, related, reviews });
  });

  app.get("/api/seo", (req, res) => {
    const requested = normalizeSeoPath(req.query.path);
    const entry = store.all("seo_entries").find((row) => row.enabled && row.path === requested);
    if (!entry) return res.status(404).json({ error: "SEO entry not found" });
    res.json({ entry });
  });

  app.get("/api/seo-index", (_req, res) => {
    const entries = store.all("seo_entries")
      .filter((row) => row.enabled && !/\bnoindex\b/i.test(row.robots))
      .map(({ path, updated_at }) => ({ path, updated_at }));
    res.json({ entries });
  });

  app.get("/api/pages/:slug", (req, res) => {
    const page = store.all("pages").find((row) => row.enabled && row.slug === req.params.slug);
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json({ page });
  });

  app.get("/api/blog", (_req, res) => {
    res.json({ posts: store.all("blog_posts").filter((row) => row.enabled) });
  });

  app.get("/api/blog/:slug", (req, res) => {
    const post = store.all("blog_posts").find((row) => row.enabled && row.slug === req.params.slug);
    if (!post) return res.status(404).json({ error: "Article not found" });
    res.json({ post });
  });

  app.post("/api/newsletter", async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email.includes("@")) return res.status(400).json({ error: "Enter a valid email" });
    const existing = store.all("newsletter").find((row) => row.email === email);
    if (!existing) await store.insert("newsletter", { email, created_at: new Date().toISOString() });
    res.json({ ok: true });
  });

  app.post("/api/inquiries", async (req, res) => {
    const { type, name, email, phone, message } = req.body || {};
    if (!name || !message) return res.status(400).json({ error: "Name and message are required" });
    const row = await store.insert("inquiries", {
      type: type || "contact",
      name,
      email: email || "",
      phone: phone || "",
      message,
      status: "new",
      created_at: new Date().toISOString(),
    });
    res.json({ ok: true, id: row.id });
  });

  app.post("/api/reviews", async (req, res) => {
    const { product_id, author, city, stars, text } = req.body || {};
    if (!product_id || !author || !text) return res.status(400).json({ error: "Name, review, and product are required" });
    const row = await store.insert("reviews", {
      product_id: Number(product_id),
      author,
      city: city || "",
      role: "Parent",
      avatar: "😊",
      stars: Math.max(1, Math.min(5, Number(stars) || 5)),
      text,
      verified: 0,
      enabled: 1,
      created_at: new Date().toISOString(),
    });
    const product = store.get("products", product_id);
    if (product) {
      const list = store.all("reviews").filter((item) => Number(item.product_id) === Number(product_id) && item.enabled);
      const rating = list.reduce((sum, item) => sum + Number(item.stars), 0) / list.length;
      await store.update("products", product.id, { rating: Math.round(rating * 10) / 10, review_count: list.length });
    }
    res.json({ ok: true, review: row });
  });

  app.post("/api/coupons/validate", (req, res) => {
    const code = String(req.body.code || "").trim().toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);
    const coupon = store.all("coupons").find((row) => row.active && row.code.toUpperCase() === code);
    if (!coupon) return res.status(404).json({ error: "Code not found" });
    if (subtotal < coupon.min_order) return res.status(400).json({ error: `Minimum order is PKR ${coupon.min_order}` });
    const discount = coupon.type === "flat" ? Math.min(coupon.value, subtotal) : Math.round(subtotal * (coupon.value / 100));
    res.json({ code: coupon.code, discount, description: coupon.description });
  });

  app.post("/api/orders", async (req, res) => {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const country = store.all("countries").find((row) => row.active && row.code === String(body.country_code || "PK").toUpperCase());
    if (!body.customer_name || !body.phone || !body.address || !body.city || !country) {
      return res.status(400).json({ error: "Name, phone, address, city, and country are required" });
    }
    const national = nationalNumber(body.phone, country);
    if (national.length !== Number(country.digits)) {
      return res.status(400).json({ error: `Enter a ${country.digits}-digit ${country.name} mobile number` });
    }
    const phone = country.code === "PK" ? `0${national}` : national;
    if (!items.length) return res.status(400).json({ error: "Your cart is empty" });
    const lines = [];
    let subtotal = 0;
    for (const item of items) {
      const product = activeProducts().find((row) => Number(row.id) === Number(item.product_id));
      if (!product) return res.status(400).json({ error: "A product in the cart is no longer available" });
      const qty = Math.max(1, Number(item.qty) || 1);
      if (product.stock < qty) return res.status(400).json({ error: `${product.name} has only ${product.stock} left` });
      lines.push({ product, qty });
      subtotal += product.price * qty;
    }
    const rules = sectionMap().commerce?.payload || { free_shipping_over: 2000, shipping_fee: 199 };
    let discount = 0;
    let couponCode = "";
    if (body.coupon_code) {
      const coupon = store.all("coupons").find((row) => row.active && row.code.toUpperCase() === String(body.coupon_code).toUpperCase());
      if (coupon && subtotal >= coupon.min_order) {
        discount = coupon.type === "flat" ? Math.min(coupon.value, subtotal) : Math.round(subtotal * (coupon.value / 100));
        couponCode = coupon.code;
      }
    }
    const shipping = subtotal - discount >= Number(rules.free_shipping_over || 2000) ? 0 : Number(rules.shipping_fee || 0);
    const total = Math.max(0, subtotal - discount + shipping);
    const seq = store.all("orders").reduce((max, row) => Math.max(max, Number(String(row.order_no).replace(/\D/g, "")) || 1000), 1000) + 1;
    const order = await store.insert("orders", {
      order_no: `KD${seq}`,
      customer_name: body.customer_name,
      email: body.email || "",
      phone,
      address: body.address,
      city: body.city,
      country_code: country.code,
      country_name: country.name,
      dial_code: country.dial,
      payment_method: body.payment_method || "cod",
      status: "Placed",
      subtotal,
      shipping,
      discount,
      total,
      coupon_code: couponCode,
      notes: body.notes || "",
      created_at: new Date().toISOString(),
    });
    const savedItems = [];
    for (const line of lines) {
      const saved = await store.insert("order_items", {
        order_id: order.id,
        product_id: line.product.id,
        name: line.product.name,
        emoji: line.product.emoji,
        image_url: line.product.image_url,
        price: line.product.price,
        qty: line.qty,
      });
      savedItems.push(saved);
      await store.update("products", line.product.id, {
        stock: line.product.stock - line.qty,
        sold: Number(line.product.sold) + line.qty,
      });
    }
    res.json({ order, items: savedItems });
  });

  app.post("/api/orders/track", (req, res) => {
    const orderNo = String(req.body.order_no || "").trim().toUpperCase();
    const phone = digits(req.body.phone);
    const order = store.all("orders").find((row) => row.order_no.toUpperCase() === orderNo && digits(row.phone) === phone);
    if (!order) return res.status(404).json({ error: "No order matches that number and phone" });
    const items = store.all("order_items").filter((row) => Number(row.order_id) === Number(order.id));
    res.json({ order, items });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
    const exists = store.all("customers").find((row) => row.email.toLowerCase() === String(email).toLowerCase());
    if (exists) return res.status(400).json({ error: "An account with that email already exists" });
    const customer = await store.insert("customers", {
      name,
      email: String(email).toLowerCase(),
      phone: phone || "",
      password_hash: hashPassword(password),
      created_at: new Date().toISOString(),
    });
    const token = sign({ id: customer.id, role: "customer", name: customer.name });
    res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const customer = store.all("customers").find((row) => row.email.toLowerCase() === String(email || "").toLowerCase());
    if (!customer || !verifyPassword(password || "", customer.password_hash)) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }
    const token = sign({ id: customer.id, role: "customer", name: customer.name });
    res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  });

  app.get("/api/auth/orders", (req, res) => {
    const user = readToken(req.headers.authorization);
    if (!user || user.role !== "customer") return res.status(401).json({ error: "Login required" });
    const customer = store.get("customers", user.id);
    if (!customer) return res.status(401).json({ error: "Login required" });
    const orders = store.all("orders").filter((row) => row.email.toLowerCase() === customer.email.toLowerCase());
    res.json({
      orders: orders.map((order) => ({
        ...order,
        items: store.all("order_items").filter((item) => Number(item.order_id) === Number(order.id)),
      })),
    });
  });

  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body || {};
    const admin = store.all("admins").find((row) => row.email.toLowerCase() === String(email || "").toLowerCase());
    if (!admin || !verifyPassword(password || "", admin.password_hash)) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }
    res.json({ token: sign({ id: admin.id, role: "admin", name: admin.name }), admin: { id: admin.id, name: admin.name, email: admin.email } });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    await store.ensureMysql();
    const orders = store.all("orders");
    const products = store.all("products");
    res.json({
      ...store.status(),
      products: products.length,
      orders: orders.length,
      revenue: orders.reduce((sum, row) => sum + Number(row.total || 0), 0),
      customers: store.all("customers").length,
      inquiries: store.all("inquiries").filter((row) => row.status === "new").length,
      lowStock: products.filter((row) => row.stock > 0 && row.stock <= 10).length,
      pendingSync: (store.data.meta.pending_tables || []).length,
    });
  });

  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    await store.ensureMysql();
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
    res.json(buildReport(days));
  });

  app.get("/api/admin/:table", requireAdmin, (req, res) => {
    if (!ADMIN_TABLES.includes(req.params.table)) return res.status(404).json({ error: "Unknown collection" });
    res.json({ rows: stripSecrets(store.all(req.params.table)) });
  });

  app.post("/api/admin/media/upload", requireAdmin, (req, res) => {
    uploadProductImage.single("file")(req, res, async (err) => {
      if (err) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : err.message;
        return res.status(400).json({ error: message });
      }
      if (!req.file) return res.status(400).json({ error: "Choose an image to upload" });
      try {
        const media = await store.insert("media_files", {
          file_name: req.file.filename,
          url: `/api/media/products/${req.file.filename}`,
          mime_type: req.file.mimetype,
          size: req.file.size,
          alt_text: String(req.body.alt_text || "").trim(),
          created_at: new Date().toISOString(),
        });
        res.json({ media });
      } catch (saveError) {
        try { fs.unlinkSync(req.file.path); } catch { /* ignore cleanup errors */ }
        res.status(500).json({ error: saveError.message || "Image could not be saved" });
      }
    });
  });

  app.post("/api/admin/:table", requireAdmin, async (req, res) => {
    const table = req.params.table;
    if (!ADMIN_TABLES.includes(table)) return res.status(404).json({ error: "Unknown collection" });
    const input = { ...req.body };
    delete input.id;
    if (table === "seo_entries") {
      input.path = normalizeSeoPath(input.path);
      if (!input.title || !input.description) return res.status(400).json({ error: "SEO title and description are required" });
      if (store.all("seo_entries").some((row) => row.path === input.path)) return res.status(409).json({ error: "An SEO entry already exists for this path" });
    }
    if (input.password) {
      input.password_hash = hashPassword(input.password);
      delete input.password;
    }
    const row = await store.insert(table, input);
    res.json({ row });
  });

  app.put("/api/admin/:table/:id", requireAdmin, async (req, res) => {
    const table = req.params.table;
    if (!ADMIN_TABLES.includes(table)) return res.status(404).json({ error: "Unknown collection" });
    const input = { ...req.body };
    delete input.id;
    delete input.password_hash;
    if (table === "seo_entries") {
      input.path = normalizeSeoPath(input.path);
      if (!input.title || !input.description) return res.status(400).json({ error: "SEO title and description are required" });
      if (store.all("seo_entries").some((row) => row.path === input.path && Number(row.id) !== Number(req.params.id))) {
        return res.status(409).json({ error: "An SEO entry already exists for this path" });
      }
    }
    if (input.password) {
      input.password_hash = hashPassword(input.password);
      delete input.password;
    } else {
      delete input.password;
    }
    const row = await store.update(table, req.params.id, input);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ row });
  });

  app.delete("/api/admin/:table/:id", requireAdmin, async (req, res) => {
    const table = req.params.table;
    if (!ADMIN_TABLES.includes(table)) return res.status(404).json({ error: "Unknown collection" });
    const media = table === "media_files" ? store.get("media_files", req.params.id) : null;
    const ok = await store.remove(table, req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    const imageUsed = ["products", "categories", "blog_posts"].some((name) => store.all(name).some((row) => row.image_url === media?.url));
    if (media?.file_name && !imageUsed) {
      try { fs.unlinkSync(path.join(PRODUCT_UPLOAD_DIR, path.basename(media.file_name))); } catch { /* file may already be gone */ }
    }
    res.json({ ok: true });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });

  app.listen(PORT, () => {
    const status = store.status();
    console.log(`Kidlo API on http://localhost:${PORT} via ${status.source}${status.mysql ? "" : ` (${status.lastError})`}`);
  });
}

main().catch((err) => {
  console.error(err);
});
