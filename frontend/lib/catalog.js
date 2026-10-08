export function catalogQuery(slug, values) {
  const read = (key) => {
    const value = typeof values.get === "function" ? values.get(key) : values[key];
    return Array.isArray(value) ? value[0] : value || "";
  };
  const search = new URLSearchParams();
  if (slug) search.set("slug", slug);
  for (const key of ["q", "age", "min", "max"]) if (read(key)) search.set(key, read(key));
  search.set("sort", read("sort") || "featured");
  return search.toString();
}
