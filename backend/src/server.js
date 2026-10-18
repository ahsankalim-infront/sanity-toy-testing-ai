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
const PAYMENT_UPLOAD_DIR = path.join(UPLOAD_ROOT, "payments");
fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(PAYMENT_UPLOAD_DIR, { recursive: true });

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
function imageUploader(folder, prefix) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, done) => done(null, folder),
      filename: (_req, file, done) => {
        const base = path.basename(file.originalname, path.extname(file.originalname))
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 50) || prefix;
        done(null, `${base}-${crypto.randomUUID().slice(0, 8)}${IMAGE_TYPES[file.mimetype] || ""}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, done) => {
      if (!IMAGE_TYPES[file.mimetype]) return done(new Error("Upload a JPG, PNG, WebP, or GIF image"));
      done(null, true);
    },
  });
}
const uploadProductImage = imageUploader(PRODUCT_UPLOAD_DIR, "product");
const uploadPaymentProof = imageUploader(PAYMENT_UPLOAD_DIR, "payment");

const PUBLIC_TABLES = ["categories", "products", "sections", "pages", "blog_posts", "reviews", "coupons"];
const ADMIN_TABLES = [...PUBLIC_TABLES, "orders", "order_items", "customers", "newsletter", "inquiries", "admins", "countries", "cities", "seo_entries", "media_files", "notifications", "games", "game_plays", "coin_transactions", "payment_accounts"];
const PROOF_METHODS = new Set(["easypaisa", "jazzcash", "bank"]);
const GAME_TYPES = ["spin", "box", "snake", "cars"];
const SKILL_TYPES = new Set(["snake", "cars"]);
const SKILL_PLAY_MS = 12 * 60 * 1000;
const SKILL_PACE_MS = { snake: 80, cars: 18 };

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

function publicPaymentAccounts() {
  return store.all("payment_accounts")
    .filter((row) => row.enabled && PROOF_METHODS.has(row.method))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.id,
      method: row.method,
      title: row.title,
      account_name: row.account_name,
      account_number: row.account_number,
      bank_name: row.bank_name,
      iban: row.iban,
      instructions: row.instructions,
    }));
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

function currentCustomer(req) {
  const user = readToken(req.headers.authorization);
  if (!user || user.role !== "customer") return null;
  return store.get("customers", user.id);
}

function requireCustomer(req, res, next) {
  const customer = currentCustomer(req);
  if (!customer) return res.status(401).json({ error: "Log in to continue" });
  req.customer = customer;
  next();
}

function coinRules() {
  const row = sectionMap().coins;
  const payload = row?.payload || {};
  return {
    enabled: Boolean(row?.enabled) && Boolean(Number(payload.enabled ?? 1)),
    coin_value_pkr: Math.max(0, Number(payload.coin_value_pkr ?? 1)),
    max_redeem_percent: Math.max(0, Math.min(100, Number(payload.max_redeem_percent ?? 20))),
    min_redeem_coins: Math.max(0, Number(payload.min_redeem_coins ?? 0)),
    signup_bonus: Math.max(0, Number(payload.signup_bonus ?? 0)),
    daily_play_limit: Math.max(0, Number(payload.daily_play_limit ?? 0)),
  };
}

function publicCustomer(customer) {
  return { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, coins: Number(customer.coins) || 0 };
}

const customerLocks = new Map();
function withCustomerLock(id, task) {
  const key = Number(id);
  const previous = customerLocks.get(key) || Promise.resolve();
  const next = previous.then(task);
  const settled = next.catch(() => {}).finally(() => { if (customerLocks.get(key) === settled) customerLocks.delete(key); });
  customerLocks.set(key, settled);
  return next;
}

async function addCoins(customerId, coins, type, reference = "", note = "") {
  const customer = store.get("customers", customerId);
  if (!customer) throw new Error("Customer not found");
  const balance = Math.max(0, (Number(customer.coins) || 0) + Number(coins));
  await store.update("customers", customer.id, { coins: balance });
  await store.insert("coin_transactions", {
    customer_id: customer.id,
    customer_name: customer.name,
    type,
    coins: Number(coins),
    balance_after: balance,
    reference,
    note,
    created_at: new Date().toISOString(),
  });
  return balance;
}

function pickPrize(prizes) {
  const total = prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.weight) || 0), 0);
  if (total <= 0) return 0;
  let roll = crypto.randomInt(total);
  for (let index = 0; index < prizes.length; index += 1) {
    roll -= Math.max(0, Number(prizes[index].weight) || 0);
    if (roll < 0) return index;
  }
  return prizes.length - 1;
}

function playsToday(customerId, gameId) {
  const today = dayKey(Date.now());
  return store.all("game_plays").filter((row) => Number(row.customer_id) === Number(customerId)
    && row.result !== "playing"
    && (gameId === undefined || Number(row.game_id) === Number(gameId))
    && dayKey(row.created_at) === today).length;
}

function publicGame(game, customerId) {
  const prizes = Array.isArray(game.prizes) ? game.prizes : [];
  const skill = SKILL_TYPES.has(game.type);
  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    type: game.type,
    emoji: game.emoji,
    description: game.description,
    cost_coins: game.cost_coins,
    daily_limit: game.daily_limit,
    prizes: prizes.map((prize) => ({
      label: prize.label,
      coins: Number(prize.coins) || 0,
      ...(skill ? { min_score: Number(prize.min_score) || 0 } : {}),
    })),
    played_today: customerId ? playsToday(customerId, game.id) : 0,
  };
}

function prizeForScore(prizes, score) {
  const ranked = prizes
    .map((prize, index) => ({ prize, index, min: Number(prize.min_score) || 0 }))
    .filter((item) => item.min <= score)
    .sort((a, b) => b.min - a.min || (Number(b.prize.coins) || 0) - (Number(a.prize.coins) || 0));
  return ranked[0] || { prize: prizes[0], index: 0 };
}

async function closeStalePlays(customerId) {
  const now = Date.now();
  for (const row of store.all("game_plays")) {
    if (Number(row.customer_id) !== Number(customerId) || row.result !== "playing") continue;
    if (now - new Date(row.created_at).getTime() < SKILL_PLAY_MS) continue;
    await store.update("game_plays", row.id, { result: "lose", prize_label: "Left unfinished", coins_won: 0, score: 0 });
  }
}

async function finishSkillPlay(customer, game, prizes, body) {
  const play = store.get("game_plays", body.play_id);
  if (!play || Number(play.customer_id) !== Number(customer.id) || Number(play.game_id) !== Number(game.id) || play.result !== "playing") {
    throw Object.assign(new Error("This game is no longer open"), { status: 400 });
  }
  const elapsed = Date.now() - new Date(play.created_at).getTime();
  if (elapsed > SKILL_PLAY_MS) {
    await store.update("game_plays", play.id, { result: "lose", prize_label: "Left unfinished", coins_won: 0, score: 0 });
    throw Object.assign(new Error("This play took too long and was closed. Come back tomorrow."), { status: 400 });
  }
  const cap = Math.floor(elapsed / SKILL_PACE_MS[game.type]) + 1;
  const score = Math.max(0, Math.min(5000, Math.floor(Number(body.score) || 0), cap));
  const picked = prizeForScore(prizes, score);
  const won = Math.max(0, Number(picked.prize.coins) || 0);
  const unit = game.type === "cars" ? "m" : "apples";
  await store.update("game_plays", play.id, {
    result: won ? "win" : "lose",
    prize_label: `${picked.prize.label} · ${score} ${unit}`,
    coins_won: won,
    score,
  });
  let balance = Number(store.get("customers", customer.id).coins) || 0;
  if (won) balance = await addCoins(customer.id, won, "game_win", `play-${play.id}`, `${picked.prize.label} on ${game.name} (${score} ${unit})`);
  return { prize: { label: picked.prize.label, coins: won }, score, balance, played_today: playsToday(customer.id, game.id) };
}

const SLUG_TABLES = { blog_posts: "title", pages: "title", products: "name", categories: "name", games: "name" };

function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function uniqueSlug(table, wanted, ownId) {
  const base = slugify(wanted) || `${table.replace(/s$/, "")}-${Date.now().toString(36)}`;
  const taken = new Set(store.all(table).filter((row) => Number(row.id) !== Number(ownId)).map((row) => row.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

function nationalDigits(value, dialCode = "") {
  let num = String(value || "").replace(/\D/g, "").replace(/^00/, "");
  const dial = String(dialCode || "").replace(/\D/g, "");
  if (dial && num.startsWith(dial) && num.length > dial.length + 6) num = num.slice(dial.length);
  if (num.startsWith("92") && num.length === 12) num = num.slice(2);
  return num.replace(/^0+/, "");
}

function optionalPhoneError(phone) {
  const count = String(phone || "").replace(/\D/g, "").length;
  if (!count) return "";
  return count < 7 || count > 15 ? "Enter a complete phone number" : "";
}

function digits(value) {
  return String(value || "").replace(/\D/g, "").replace(/^92/, "0");
}

function normalizeSeoPath(value) {
  let pathValue = String(value || "/").trim();
  if (!pathValue.startsWith("/")) pathValue = `/${pathValue}`;
  return pathValue.length > 1 ? pathValue.replace(/\/+$/, "") : pathValue;
}

async function notify({ type, title, body, href }) {
  await store.insert("notifications", {
    type,
    title,
    body: body || "",
    href: href || "/admin",
    read: 0,
    created_at: new Date().toISOString(),
  });
}

function nationalNumber(raw, country) {
  let value = String(raw || "").replace(/\D/g, "");
  const dial = String(country.dial || "").replace(/\D/g, "");
  if (dial && value.startsWith(dial) && value.length > Number(country.digits)) value = value.slice(dial.length);
  value = value.replace(/^0+/, "");
  return value;
}

const PAYMENT_METHODS = ["cod", "card", "easypaisa", "jazzcash", "bank"];

function checkoutDetails(body, country) {
  const name = String(body.customer_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const address = String(body.address || "").trim();
  const city = String(body.city || "").trim();
  const notes = String(body.notes || "").trim();
  const coupon = String(body.coupon_code || "").trim().toUpperCase();
  const national = country ? nationalNumber(body.phone, country) : "";
  const errors = {};
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.customer_name = "Enter the full name for delivery";
  else if (name.length > 80) errors.customer_name = "Name must be 80 characters or less";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) errors.email = "Enter a valid email address";
  if (address.length < 8) errors.address = "Enter the house number, street, and area";
  else if (address.length > 180) errors.address = "Address must be 180 characters or less";
  if (city.length < 2 || city.length > 60) errors.city = "Enter a city";
  if (!country) errors.phone = "Choose a country for the mobile number";
  else if (national.length !== Number(country.digits)) errors.phone = `Enter a ${country.digits}-digit ${country.name} mobile number`;
  if (!PAYMENT_METHODS.includes(body.payment_method || "cod")) errors.payment_method = "Choose a payment method";
  if (notes.length > 240) errors.notes = "Gift note must be 240 characters or less";
  if (coupon && !/^[A-Z0-9]{3,20}$/.test(coupon)) errors.coupon_code = "Promo codes use 3 to 20 letters or numbers";
  const txn = String(body.payment_txn || "").trim();
  const proof = String(body.payment_proof_url || "").trim();
  if (PROOF_METHODS.has(body.payment_method)) {
    if (!Number(body.payment_account_id)) errors.payment_account_id = "Choose the account you paid to";
    if (!/^\/api\/media\/payments\/[A-Za-z0-9._-]+$/.test(proof)) errors.payment_proof_url = "Upload a screenshot or receipt of the payment";
    if (txn && !/^[A-Za-z0-9-]{4,32}$/.test(txn)) errors.payment_txn = "Enter the transaction ID from your receipt";
  }
  return { errors, name, email, address, city, notes, coupon, national, txn, proof };
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
  const seed = buildSeed();
  const sectionKeys = new Set(store.all("sections").map((row) => row.section_key));
  const missingSections = seed.sections.filter((row) => !sectionKeys.has(row.section_key));
  if (missingSections.length) {
    let nextId = store.all("sections").reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
    store.data.sections = store.all("sections").concat(missingSections.map((row) => ({ ...row, id: ++nextId, sort_order: nextId })));
    await store.persist("sections");
  }
  if (!store.data.meta.games_seeded) {
    if (!store.all("games").length) {
      store.data.games = seed.games;
      await store.persist("games");
    }
    store.data.meta.games_seeded = 1;
    store.writeFile(store.data);
  }
  const knownSlugs = new Set(store.all("games").map((row) => row.slug));
  const missingGames = seed.games.filter((row) => !knownSlugs.has(row.slug));
  if (missingGames.length) {
    let nextId = store.all("games").reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
    store.data.games = store.all("games").concat(missingGames.map((row) => ({ ...row, id: ++nextId })));
    await store.persist("games");
  }
  if (!store.data.meta.chance_daily_once) {
    store.data.games = store.all("games").map((row) => (row.type === "spin" || row.type === "box" ? { ...row, daily_limit: 1 } : row));
    store.data.meta.chance_daily_once = 1;
    await store.persist("games");
  }
  if (!store.data.meta.coins_per_game_limit) {
    const coins = store.all("sections").find((row) => row.section_key === "coins");
    if (coins && Number(coins.payload?.daily_play_limit) === 3) {
      await store.update("sections", coins.id, { payload: { ...coins.payload, daily_play_limit: 0 } });
    }
    const banner = store.all("sections").find((row) => row.section_key === "play_banner");
    const freshBanner = seed.sections.find((row) => row.section_key === "play_banner");
    if (banner && freshBanner && banner.payload?.text?.includes("mystery box")) {
      await store.update("sections", banner.id, { payload: { ...banner.payload, text: freshBanner.payload.text } });
    }
    store.data.meta.coins_per_game_limit = 1;
    store.writeFile(store.data);
  }
  if (!store.all("payment_accounts").length && !store.data.meta.payment_accounts_seeded) {
    store.data.payment_accounts = seed.payment_accounts;
    store.data.meta.payment_accounts_seeded = 1;
    await store.persist("payment_accounts");
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

  app.get("/api/payments", (_req, res) => {
    res.json({ accounts: publicPaymentAccounts(), methods: [...PROOF_METHODS] });
  });

  app.post("/api/checkout/payment-proof", (req, res) => {
    uploadPaymentProof.single("file")(req, res, (err) => {
      if (err) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Receipt must be 5 MB or smaller" : err.message;
        return res.status(400).json({ error: message });
      }
      if (!req.file) return res.status(400).json({ error: "Choose a screenshot or receipt to upload" });
      res.json({ url: `/api/media/payments/${req.file.filename}`, file_name: req.file.filename });
    });
  });

  app.get("/api/places", (_req, res) => {
    const countries = store.all("countries").filter((row) => row.active).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    const cities = store.all("cities").filter((row) => row.active).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    res.json({ countries, cities });
  });

  app.get("/api/home", (_req, res) => res.json(publicHome()));
  app.get("/api/shell", (_req, res) => {
    const home = publicHome();
    res.json({ ...store.status(), sections: home.sections, categories: home.categories, payment_accounts: publicPaymentAccounts() });
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
    if (!existing) {
      await store.insert("newsletter", { email, created_at: new Date().toISOString() });
      await notify({ type: "newsletter", title: "New newsletter subscriber", body: email, href: "/admin/newsletter" });
    }
    res.json({ ok: true });
  });

  app.post("/api/inquiries", async (req, res) => {
    const { type, name, email, phone, message } = req.body || {};
    if (!name || !message) return res.status(400).json({ error: "Name and message are required" });
    if (optionalPhoneError(phone)) return res.status(400).json({ error: optionalPhoneError(phone) });
    const row = await store.insert("inquiries", {
      type: type || "contact",
      name,
      email: email || "",
      phone: phone || "",
      message,
      status: "new",
      created_at: new Date().toISOString(),
    });
    await notify({ type: "inquiry", title: `New ${row.type} message`, body: `${row.name}: ${row.message}`, href: "/admin/inquiries" });
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
    await notify({ type: "review", title: `New review from ${author}`, body: text, href: "/admin/reviews" });
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
    const details = checkoutDetails(body, country);
    const method = body.payment_method || "cod";
    let account = null;
    if (PROOF_METHODS.has(method)) {
      account = store.all("payment_accounts").find((row) => row.enabled && row.method === method && Number(row.id) === Number(body.payment_account_id));
      if (!account) details.errors.payment_account_id = "Choose a live Kidlo account for this payment method";
    }
    if (Object.keys(details.errors).length) {
      return res.status(400).json({ error: Object.values(details.errors)[0], fields: details.errors });
    }
    const phone = country.code === "PK" ? `0${details.national}` : details.national;
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
    if (details.coupon) {
      const coupon = store.all("coupons").find((row) => row.active && row.code.toUpperCase() === details.coupon);
      if (coupon && subtotal >= coupon.min_order) {
        discount = coupon.type === "flat" ? Math.min(coupon.value, subtotal) : Math.round(subtotal * (coupon.value / 100));
        couponCode = coupon.code;
      }
    }
    const shipping = subtotal - discount >= Number(rules.free_shipping_over || 2000) ? 0 : Number(rules.shipping_fee || 0);
    const seq = store.all("orders").reduce((max, row) => Math.max(max, Number(String(row.order_no).replace(/\D/g, "")) || 1000), 1000) + 1;
    const orderNo = `KD${seq}`;
    const customer = currentCustomer(req);
    const requestedCoins = Math.max(0, Math.floor(Number(body.use_coins) || 0));
    let coinsUsed = 0;
    let coinsDiscount = 0;
    if (customer && requestedCoins) {
      const coinRule = coinRules();
      if (!coinRule.enabled || !coinRule.coin_value_pkr) return res.status(400).json({ error: "Kidlo Coins cannot be used right now" });
      try {
        await withCustomerLock(customer.id, async () => {
          const fresh = store.get("customers", customer.id);
          const maxCoins = Math.floor(Math.floor((subtotal - discount) * coinRule.max_redeem_percent / 100) / coinRule.coin_value_pkr);
          const usable = Math.min(requestedCoins, Number(fresh.coins) || 0, maxCoins);
          if (usable < coinRule.min_redeem_coins) {
            throw new Error(`Use at least ${coinRule.min_redeem_coins} coins, up to ${coinRule.max_redeem_percent}% of the order`);
          }
          coinsUsed = usable;
          coinsDiscount = Math.round(usable * coinRule.coin_value_pkr);
          await addCoins(customer.id, -usable, "order_redeem", orderNo, `Used on order ${orderNo}`);
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }
    const total = Math.max(0, subtotal - discount - coinsDiscount + shipping);
    const order = await store.insert("orders", {
      order_no: orderNo,
      customer_name: details.name,
      email: details.email,
      phone,
      address: details.address,
      city: details.city,
      country_code: country.code,
      country_name: country.name,
      dial_code: country.dial,
      payment_method: method,
      status: PROOF_METHODS.has(method) ? "Payment pending" : "Placed",
      payment_status: PROOF_METHODS.has(method) ? "submitted" : "",
      payment_account_id: account?.id || 0,
      payment_account_label: account ? `${account.title} · ${account.account_name} · ${account.account_number}` : "",
      payment_txn: details.txn,
      payment_proof_url: details.proof,
      payment_note: "",
      subtotal,
      shipping,
      discount,
      total,
      coupon_code: couponCode,
      customer_id: customer?.id || 0,
      coins_used: coinsUsed,
      coins_discount: coinsDiscount,
      coins_refunded: 0,
      notes: details.notes,
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
      const nextStock = line.product.stock - line.qty;
      await store.update("products", line.product.id, {
        stock: nextStock,
        sold: Number(line.product.sold) + line.qty,
      });
      if (nextStock <= 5) {
        await notify({ type: "stock", title: `${line.product.name} is low on stock`, body: `${nextStock} left`, href: "/admin/products" });
      }
    }
    await notify({
      type: PROOF_METHODS.has(method) ? "payment" : "order",
      title: PROOF_METHODS.has(method) ? `Payment proof for ${order.order_no}` : `Order ${order.order_no} placed`,
      body: `${order.customer_name} · ${order.city} · PKR ${order.total}${account ? ` · ${account.title}` : ""}`,
      href: "/admin/orders",
    });
    res.json({ order, items: savedItems, coins: customer ? Number(store.get("customers", customer.id).coins) || 0 : null });
  });

  app.post("/api/orders/track", (req, res) => {
    const orderNo = String(req.body.order_no || "").trim().toUpperCase();
    const order = store.all("orders").find((row) => row.order_no.toUpperCase() === orderNo
      && nationalDigits(row.phone, row.dial_code) === nationalDigits(req.body.phone, row.dial_code));
    if (!order) return res.status(404).json({ error: "No order matches that number and phone" });
    const items = store.all("order_items").filter((row) => Number(row.order_id) === Number(order.id));
    res.json({ order, items });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
    if (optionalPhoneError(phone)) return res.status(400).json({ error: optionalPhoneError(phone) });
    const exists = store.all("customers").find((row) => row.email.toLowerCase() === String(email).toLowerCase());
    if (exists) return res.status(400).json({ error: "An account with that email already exists" });
    const customer = await store.insert("customers", {
      name,
      email: String(email).toLowerCase(),
      phone: phone || "",
      password_hash: hashPassword(password),
      coins: 0,
      games_blocked: 0,
      created_at: new Date().toISOString(),
    });
    const rules = coinRules();
    if (rules.enabled && rules.signup_bonus) {
      await addCoins(customer.id, rules.signup_bonus, "signup_bonus", "", "Welcome bonus");
    }
    const token = sign({ id: customer.id, role: "customer", name: customer.name });
    res.json({ token, customer: publicCustomer(store.get("customers", customer.id)) });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const customer = store.all("customers").find((row) => row.email.toLowerCase() === String(email || "").toLowerCase());
    if (!customer || !verifyPassword(password || "", customer.password_hash)) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }
    const token = sign({ id: customer.id, role: "customer", name: customer.name });
    res.json({ token, customer: publicCustomer(customer) });
  });

  app.get("/api/me", requireCustomer, (req, res) => {
    const customer = req.customer;
    const transactions = store.all("coin_transactions")
      .filter((row) => Number(row.customer_id) === Number(customer.id))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 30);
    res.json({ customer: publicCustomer(customer), rules: coinRules(), transactions, plays_today: playsToday(customer.id) });
  });

  app.get("/api/games", (req, res) => {
    const customer = currentCustomer(req);
    const games = store.all("games")
      .filter((row) => row.enabled && GAME_TYPES.includes(row.type))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => publicGame(row, customer?.id));
    res.json({
      rules: coinRules(),
      games,
      customer: customer ? publicCustomer(customer) : null,
      plays_today: customer ? playsToday(customer.id) : 0,
      blocked: Boolean(customer?.games_blocked),
    });
  });

  app.post("/api/games/:id/play", requireCustomer, async (req, res) => {
    const rules = coinRules();
    if (!rules.enabled) return res.status(403).json({ error: "Kidlo Coins games are paused right now" });
    if (req.customer.games_blocked) return res.status(403).json({ error: "Games are turned off for this account. Contact support for help." });
    const game = store.all("games").find((row) => Number(row.id) === Number(req.params.id) && row.enabled && GAME_TYPES.includes(row.type));
    if (!game) return res.status(404).json({ error: "Game not found" });
    const prizes = Array.isArray(game.prizes) ? game.prizes : [];
    if (!prizes.length) return res.status(400).json({ error: "This game has no prizes set up yet" });
    try {
      const result = await withCustomerLock(req.customer.id, async () => {
        const customer = store.get("customers", req.customer.id);
        if (SKILL_TYPES.has(game.type) && req.body?.action === "finish") {
          return finishSkillPlay(customer, game, prizes, req.body);
        }
        await closeStalePlays(customer.id);
        if (SKILL_TYPES.has(game.type)) {
          const open = store.all("game_plays").find((row) => Number(row.customer_id) === Number(customer.id) && Number(row.game_id) === Number(game.id) && row.result === "playing");
          if (open) return { play_id: open.id, resumed: true };
        }
        if (game.daily_limit && playsToday(customer.id, game.id) >= game.daily_limit) {
          throw Object.assign(new Error(`You have used all ${game.daily_limit} plays of ${game.name} today. Come back tomorrow.`), { status: 429 });
        }
        if (rules.daily_play_limit && playsToday(customer.id) >= rules.daily_play_limit) {
          throw Object.assign(new Error(`You have used all ${rules.daily_play_limit} game plays for today. Come back tomorrow.`), { status: 429 });
        }
        const cost = Math.max(0, Number(game.cost_coins) || 0);
        if (cost > (Number(customer.coins) || 0)) {
          throw Object.assign(new Error(`You need ${cost} coins to play ${game.name}`), { status: 400 });
        }
        if (cost) await addCoins(customer.id, -cost, "game_entry", game.slug, `Played ${game.name}`);
        if (SKILL_TYPES.has(game.type)) {
          const play = await store.insert("game_plays", {
            customer_id: customer.id, customer_name: customer.name, game_id: game.id, game_name: game.name,
            result: "playing", prize_label: "", coins_won: 0, score: 0, created_at: new Date().toISOString(),
          });
          return { play_id: play.id, resumed: false };
        }
        const index = pickPrize(prizes);
        const prize = prizes[index];
        const won = Math.max(0, Number(prize.coins) || 0);
        const play = await store.insert("game_plays", {
          customer_id: customer.id,
          customer_name: customer.name,
          game_id: game.id,
          game_name: game.name,
          result: won ? "win" : "lose",
          prize_label: prize.label,
          coins_won: won,
          score: 0,
          created_at: new Date().toISOString(),
        });
        let balance = Number(store.get("customers", customer.id).coins) || 0;
        if (won) balance = await addCoins(customer.id, won, "game_win", `play-${play.id}`, `Won ${prize.label} on ${game.name}`);
        return { index, prize: { label: prize.label, coins: won }, balance, played_today: playsToday(customer.id, game.id) };
      });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || "The game could not start" });
    }
  });

  app.get("/api/auth/orders", (req, res) => {
    const user = readToken(req.headers.authorization);
    if (!user || user.role !== "customer") return res.status(401).json({ error: "Login required" });
    const customer = store.get("customers", user.id);
    if (!customer) return res.status(401).json({ error: "Login required" });
    const orders = store.all("orders").filter((row) => Number(row.customer_id) === Number(customer.id) || row.email.toLowerCase() === customer.email.toLowerCase());
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

  app.post("/api/admin/customers/:id/coins", requireAdmin, async (req, res) => {
    const customer = store.get("customers", req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const delta = Math.trunc(Number(req.body?.coins) || 0);
    if (!delta) return res.status(400).json({ error: "Enter a positive or negative coin amount" });
    const balance = await withCustomerLock(customer.id, () => addCoins(customer.id, delta, "admin_adjust", req.user.name || "admin", String(req.body?.note || "Adjusted by admin").slice(0, 240)));
    res.json({ balance });
  });

  app.get("/api/admin/coins/summary", requireAdmin, (_req, res) => {
    const customers = store.all("customers");
    const tx = store.all("coin_transactions");
    const plays = store.all("game_plays");
    const sum = (rows) => rows.reduce((total, row) => total + Number(row.coins || 0), 0);
    res.json({
      rules: coinRules(),
      outstanding: customers.reduce((total, row) => total + (Number(row.coins) || 0), 0),
      issued: sum(tx.filter((row) => Number(row.coins) > 0)),
      redeemed: -sum(tx.filter((row) => row.type === "order_redeem")),
      plays: plays.length,
      wins: plays.filter((row) => row.result === "win").length,
      players: new Set(plays.map((row) => row.customer_id)).size,
    });
  });

  app.post("/api/admin/orders/:id/payment", requireAdmin, async (req, res) => {
    const order = store.get("orders", req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!PROOF_METHODS.has(order.payment_method)) return res.status(400).json({ error: "This order does not need payment proof" });
    const next = String(req.body?.status || "");
    if (!["verified", "rejected"].includes(next)) return res.status(400).json({ error: "Mark the payment as verified or rejected" });
    const row = await store.update("orders", order.id, {
      payment_status: next,
      payment_note: String(req.body?.note || "").trim().slice(0, 180),
      status: next === "verified" && order.status === "Payment pending" ? "Processing" : order.status,
    });
    await notify({
      type: "payment",
      title: next === "verified" ? `Payment verified for ${order.order_no}` : `Payment rejected for ${order.order_no}`,
      body: `${order.customer_name} · PKR ${order.total}`,
      href: "/admin/orders",
    });
    res.json({ row });
  });

  app.post("/api/admin/notifications/read-all", requireAdmin, async (_req, res) => {
    store.data.notifications = store.all("notifications").map((row) => ({ ...row, read: 1 }));
    await store.persist("notifications");
    res.json({ ok: true });
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
    if (table === "games" && !GAME_TYPES.includes(input.type)) {
      return res.status(400).json({ error: `Game type must be one of: ${GAME_TYPES.join(", ")}` });
    }
    if (SLUG_TABLES[table]) {
      if (!input.slug && !input[SLUG_TABLES[table]]) return res.status(400).json({ error: `Add a ${SLUG_TABLES[table]} first` });
      input.slug = uniqueSlug(table, input.slug || input[SLUG_TABLES[table]]);
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
    if (table === "games" && input.type && !GAME_TYPES.includes(input.type)) {
      return res.status(400).json({ error: `Game type must be one of: ${GAME_TYPES.join(", ")}` });
    }
    if (input.password) {
      input.password_hash = hashPassword(input.password);
      delete input.password;
    } else {
      delete input.password;
    }
    const before = store.get(table, req.params.id);
    if (!before) return res.status(404).json({ error: "Not found" });
    if (SLUG_TABLES[table] && "slug" in input) {
      input.slug = uniqueSlug(table, input.slug || input[SLUG_TABLES[table]] || before[SLUG_TABLES[table]], before.id);
    }
    let coinDelta = 0;
    if (table === "customers" && input.coins !== undefined) {
      coinDelta = Math.trunc(Number(input.coins) || 0) - (Number(before.coins) || 0);
      delete input.coins;
    }
    let row = await store.update(table, req.params.id, input);
    if (coinDelta) {
      await withCustomerLock(row.id, () => addCoins(row.id, coinDelta, "admin_adjust", req.user.name || "admin", "Balance edited by admin"));
      row = store.get(table, row.id);
    }
    if (table === "orders" && row.status === "Cancelled" && before.status !== "Cancelled" && row.coins_used && !row.coins_refunded && row.customer_id) {
      if (store.get("customers", row.customer_id)) {
        await withCustomerLock(row.customer_id, () => addCoins(row.customer_id, row.coins_used, "order_refund", row.order_no, `Refund for cancelled order ${row.order_no}`));
      }
      row = await store.update("orders", row.id, { coins_refunded: 1 });
    }
    res.json({ row: stripSecrets([row])[0] });
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
