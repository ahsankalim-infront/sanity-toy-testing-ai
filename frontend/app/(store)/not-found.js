import Link from "next/link";

export default function StoreNotFound() {
  return (
    <section className="page-body">
      <div className="form-card checkout-empty">
        <div className="big">🧸</div>
        <h1 className="sec-head">This page is not available</h1>
        <p className="sec-sub">It may have been moved, hidden, or is no longer on sale.</p>
        <div className="row-actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-orange" href="/">Back to the store</Link>
          <Link className="btn btn-outline" href="/search">Search toys</Link>
        </div>
      </div>
    </section>
  );
}
