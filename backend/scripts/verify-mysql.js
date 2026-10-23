const mysql = require("mysql2/promise");
const { TABLES } = require("../src/schema");

const API = "http://127.0.0.1:4000";
const stamp = Date.now();
const fail = [];
const pass = [];

function ok(name) {
  pass.push(name);
  console.log(`PASS  ${name}`);
}
function bad(name, err) {
  fail.push(`${name}: ${err.message || err}`);
  console.log(`FAIL  ${name}: ${err.message || err}`);
}

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `${res.status} ${path}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function mysqlQuery(sql, values) {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "kidlo",
  });
  try {
    const [rows] = await conn.query(sql, values || []);
    return rows;
  } finally {
    await conn.end();
  }
}

async function main() {
  const health = await req("GET", "/api/health");
  if (!health.mysql || health.source !== "mysql") throw new Error(`API is not on MySQL: ${JSON.stringify(health)}`);
  ok("GET /api/health mysql");

  const counts = {};
  for (const name of Object.keys(TABLES)) {
    const rows = await mysqlQuery(`SELECT COUNT(*) AS c FROM \`${name}\``);
    counts[name] = Number(rows[0].c);
    if (["products", "categories", "sections", "payment_accounts", "admins", "games"].includes(name) && counts[name] === 0) {
      throw new Error(`MySQL table ${name} is empty`);
    }
  }
  ok(`MySQL tables seeded (${Object.keys(TABLES).length})`);

  const publicGets = [
    "/api/home",
    "/api/shell",
    "/api/places",
    "/api/payments",
    "/api/catalog",
    "/api/blog",
    "/api/seo?path=/",
    "/api/seo-index",
    "/api/games",
  ];
  for (const path of publicGets) {
    try {
      const data = await req("GET", path);
      if (path === "/api/payments" && !data.accounts?.length) throw new Error("no payment accounts");
      if (path === "/api/home" && !data.products?.length) throw new Error("no products");
      ok(`GET ${path}`);
    } catch (err) {
      bad(`GET ${path}`, err);
    }
  }

  const home = await req("GET", "/api/home");
  const product = home.products[0];
  const post = (await req("GET", "/api/blog")).posts[0];
  await req("GET", `/api/products/${product.slug}`);
  ok(`GET /api/products/${product.slug}`);
  if (post) {
    await req("GET", `/api/blog/${post.slug}`);
    ok(`GET /api/blog/${post.slug}`);
  }

  const admin = await req("POST", "/api/admin/login", { email: "admin@kidlo.pk", password: "kidlo123" });
  const adminToken = admin.token;
  ok("POST /api/admin/login");

  for (const table of ["products", "orders", "customers", "notifications", "payment_accounts", "games", "newsletter"]) {
    const data = await req("GET", `/api/admin/${table}`, undefined, adminToken);
    if (!Array.isArray(data.rows)) throw new Error(`${table} rows missing`);
    ok(`GET /api/admin/${table}`);
  }

  await req("GET", "/api/admin/stats", undefined, adminToken);
  ok("GET /api/admin/stats");
  await req("GET", "/api/admin/reports?days=1", undefined, adminToken);
  ok("GET /api/admin/reports");
  await req("GET", "/api/admin/coins/summary", undefined, adminToken);
  ok("GET /api/admin/coins/summary");

  const email = `mysql-verify-${stamp}@kidlo.test`;
  await req("POST", "/api/newsletter", { email });
  const news = await mysqlQuery("SELECT * FROM newsletter WHERE email = ?", [email]);
  if (!news.length) throw new Error("newsletter not in MySQL");
  ok("POST /api/newsletter -> MySQL");

  const inquiry = await req("POST", "/api/inquiries", {
    type: "contact",
    name: "MySQL Verify",
    email,
    phone: "03001234567",
    message: "Please confirm MySQL inquiry write.",
  });
  const inqRows = await mysqlQuery("SELECT * FROM inquiries WHERE id = ?", [inquiry.id]);
  if (!inqRows.length) throw new Error("inquiry not in MySQL");
  ok("POST /api/inquiries -> MySQL");

  const review = await req("POST", "/api/reviews", {
    product_id: product.id,
    author: "MySQL Parent",
    city: "Lahore",
    stars: 5,
    text: "Confirming reviews persist in MySQL.",
  });
  const revRows = await mysqlQuery("SELECT * FROM reviews WHERE id = ?", [review.review.id]);
  if (!revRows.length) throw new Error("review not in MySQL");
  ok("POST /api/reviews -> MySQL");

  const coupon = (await req("GET", "/api/admin/coupons", undefined, adminToken)).rows.find((row) => row.active);
  if (coupon) {
    await req("POST", "/api/coupons/validate", { code: coupon.code, subtotal: Math.max(coupon.min_order, 5000) });
    ok("POST /api/coupons/validate");
  }

  const customer = await req("POST", "/api/auth/register", {
    name: "MySQL Shopper",
    email,
    phone: "03007654321",
    password: "kidlo123",
  });
  const custRows = await mysqlQuery("SELECT * FROM customers WHERE email = ?", [email]);
  if (!custRows.length) throw new Error("customer not in MySQL");
  ok("POST /api/auth/register -> MySQL");
  await req("POST", "/api/auth/login", { email, password: "kidlo123" });
  ok("POST /api/auth/login");
  await req("GET", "/api/me", undefined, customer.token);
  ok("GET /api/me");
  await req("GET", "/api/auth/orders", undefined, customer.token);
  ok("GET /api/auth/orders");

  const created = await req("POST", "/api/admin/pages", {
    slug: `mysql-verify-${stamp}`,
    title: "MySQL Verify Page",
    group_name: "Company",
    excerpt: "Temporary verify page",
    content: "Created by MySQL integration check.",
    emoji: "✅",
    enabled: 1,
    sort_order: 99,
  }, adminToken);
  const pageId = created.row.id;
  const pageRows = await mysqlQuery("SELECT * FROM pages WHERE id = ?", [pageId]);
  if (!pageRows.length || pageRows[0].title !== "MySQL Verify Page") throw new Error("admin POST page missing in MySQL");
  ok("POST /api/admin/pages -> MySQL");

  await req("PUT", `/api/admin/pages/${pageId}`, { title: "MySQL Verify Page Updated", description: "x", excerpt: "updated" }, adminToken);
  const putRows = await mysqlQuery("SELECT title FROM pages WHERE id = ?", [pageId]);
  if (putRows[0].title !== "MySQL Verify Page Updated") throw new Error("PUT did not update MySQL");
  ok("PUT /api/admin/pages/:id -> MySQL");

  await req("PATCH", `/api/admin/pages/${pageId}`, { excerpt: "patched via mysql" }, adminToken);
  const patchRows = await mysqlQuery("SELECT excerpt FROM pages WHERE id = ?", [pageId]);
  if (patchRows[0].excerpt !== "patched via mysql") throw new Error("PATCH did not update MySQL");
  ok("PATCH /api/admin/pages/:id -> MySQL");

  await req("DELETE", `/api/admin/pages/${pageId}`, undefined, adminToken);
  const delRows = await mysqlQuery("SELECT id FROM pages WHERE id = ?", [pageId]);
  if (delRows.length) throw new Error("DELETE left page in MySQL");
  ok("DELETE /api/admin/pages/:id -> MySQL");

  const account = (await req("GET", "/api/payments")).accounts.find((row) => row.method === "easypaisa");
  const order = await req("POST", "/api/orders", {
    customer_name: "MySQL Buyer",
    email,
    phone: "03001234567",
    address: "12 Test Street, Block A",
    city: "Lahore",
    country_code: "PK",
    payment_method: "easypaisa",
    payment_account_id: account.id,
    payment_proof_url: "/api/media/payments/verify.png",
    payment_txn: "EP12345678",
    items: [{ product_id: product.id, qty: 1 }],
  }, customer.token);
  const orderRows = await mysqlQuery("SELECT * FROM orders WHERE order_no = ?", [order.order.order_no]);
  if (!orderRows.length) throw new Error("order not in MySQL");
  ok("POST /api/orders -> MySQL");

  await req("POST", "/api/orders/track", { order_no: order.order.order_no, phone: "03001234567" });
  ok("POST /api/orders/track");

  await req("POST", `/api/admin/orders/${order.order.id}/payment`, { status: "verified" }, adminToken);
  const paid = await mysqlQuery("SELECT payment_status, status FROM orders WHERE id = ?", [order.order.id]);
  if (paid[0].payment_status !== "verified") throw new Error("payment verify missing in MySQL");
  ok("POST /api/admin/orders/:id/payment -> MySQL");

  await req("POST", "/api/admin/notifications/read-all", {}, adminToken);
  ok("POST /api/admin/notifications/read-all");

  await req("DELETE", `/api/admin/newsletter/${news[0].id}`, undefined, adminToken);
  await req("DELETE", `/api/admin/inquiries/${inquiry.id}`, undefined, adminToken);
  await req("DELETE", `/api/admin/reviews/${review.review.id}`, undefined, adminToken);
  ok("DELETE cleanup of verify rows");

  console.log(`\n${pass.length} passed, ${fail.length} failed`);
  if (fail.length) {
    for (const item of fail) console.log(` - ${item}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("VERIFY CRASH", err);
  process.exit(1);
});
