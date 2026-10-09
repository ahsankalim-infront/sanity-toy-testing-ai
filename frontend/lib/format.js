export function pkr(value) {
  const amount = Number(value || 0);
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function discount(price, compare) {
  if (!compare || Number(compare) <= Number(price)) return 0;
  return Math.round((1 - Number(price) / Number(compare)) * 100);
}

export function stars(rating) {
  const full = Math.round(Number(rating) || 0);
  return `${"★".repeat(full)}${"☆".repeat(Math.max(0, 5 - full))}`;
}

function serverApiBase() {
  // Bracket access stays dynamic. Next.js would otherwise inline process.env.API_URL
  // at build time, before Vercel injects the service binding.
  const bound = process.env["API_URL"];
  return bound || "http://127.0.0.1:4000";
}

export function apiBase() {
  if (typeof window === "undefined") return serverApiBase();
  return "";
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isForm) headers["Content-Type"] = "application/json";
  const base = apiBase();
  const url = base ? new URL(path, base.endsWith("/") ? base : `${base}/`) : path;
  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
    body: options.body && typeof options.body !== "string" && !isForm ? JSON.stringify(options.body) : options.body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
