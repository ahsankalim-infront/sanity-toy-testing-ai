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

export function apiBase() {
  if (typeof window === "undefined") return process.env.API_URL || "http://127.0.0.1:4000";
  return "";
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers,
    cache: "no-store",
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
