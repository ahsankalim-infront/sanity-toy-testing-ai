"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, pkr } from "../../lib/format";
import { adminHeaders } from "../../components/admin/AdminShell";
import { BarList, Donut, TrendChart } from "../../components/admin/Charts";

const RANGES = [
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
  [365, "12 months"],
];

const CSV_COLUMNS = ["order_no", "created_at", "customer_name", "phone", "city", "payment_method", "status", "subtotal", "discount", "shipping", "total", "coupon_code"];

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api(`/api/admin/reports?days=${days}`, { headers: adminHeaders() })
      .then((data) => { setReport(data); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  function exportCsv() {
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [CSV_COLUMNS.join(","), ...report.orders.map((row) => CSV_COLUMNS.map((key) => escape(row[key])).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kidlo-orders-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (error && !report) return <p className="note">{error}</p>;
  if (!report) return <DashboardSkeleton />;
  const { summary, change } = report;

  return (
    <div className={loading ? "is-loading" : ""}>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34, marginBottom: 4 }}>Store dashboard</h1>
          <p className="muted">Sales report for the last {RANGES.find(([value]) => value === days)?.[1]} compared with the period before.</p>
        </div>
        <div className="row-actions">
          <div className="seg">
            {RANGES.map(([value, label]) => (
              <button type="button" key={value} className={days === value ? "on" : ""} onClick={() => setDays(value)}>{label}</button>
            ))}
          </div>
          <button type="button" className="btn btn-dark" onClick={exportCsv} disabled={!report.orders.length}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="db-status">
        <span className={`pill ${report.mysql ? "good" : "bad"}`}>{report.mysql ? "MySQL live · JSON mirrored" : "MySQL down · serving JSON"}</span>
        {report.pendingSync ? <span className="pill">{report.pendingSync} tables waiting to sync to MySQL</span> : null}
        {report.inquiries ? <Link href="/admin/inquiries" className="pill">{report.inquiries} new messages</Link> : null}
        <span className="pill">{report.newsletter} newsletter subscribers</span>
      </div>

      <div className="kpi-grid">
        <Kpi label="Revenue" value={pkr(summary.revenue)} delta={change.revenue} />
        <Kpi label="Orders" value={summary.orders} delta={change.orders} />
        <Kpi label="Average order" value={pkr(summary.aov)} delta={change.aov} />
        <Kpi label="Units sold" value={summary.units} delta={change.units} />
        <Kpi label="Discounts given" value={pkr(summary.discounts)} delta={change.discounts} invert />
        <Kpi label="Cancelled" value={summary.cancelled} delta={change.cancelled} invert />
      </div>

      <div className="report-card">
        <div className="report-head"><h3>Revenue and orders by day</h3><span className="muted">Cancelled orders are excluded from revenue</span></div>
        <TrendChart data={report.daily} />
      </div>

      <div className="report-grid">
        <div className="report-card">
          <div className="report-head"><h3>Order status</h3></div>
          <Donut data={report.status} />
        </div>
        <div className="report-card">
          <div className="report-head"><h3>Payment methods</h3><span className="muted">by revenue</span></div>
          <Donut data={report.payments} money />
        </div>
        <div className="report-card">
          <div className="report-head"><h3>Sales by category</h3></div>
          <BarList data={report.categories} color="#8B5CF6" />
        </div>
        <div className="report-card">
          <div className="report-head"><h3>Top cities</h3></div>
          <BarList data={report.cities} color="#00B8C8" />
        </div>
      </div>

      <div className="report-grid two">
        <div className="report-card">
          <div className="report-head"><h3>Best-selling products</h3><Link className="muted" href="/admin/products">Manage →</Link></div>
          <div className="table-wrap flat">
            <table className="data">
              <thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
              <tbody>
                {report.topProducts.map((row) => (
                  <tr key={row.id}><td>{row.emoji} {row.name}</td><td>{row.units}</td><td>{pkr(row.revenue)}</td></tr>
                ))}
                {!report.topProducts.length ? <tr><td colSpan={3} className="muted">No sales in this period.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
        <div className="report-card">
          <div className="report-head"><h3>Low stock</h3><span className="muted">10 or fewer left</span></div>
          <div className="table-wrap flat">
            <table className="data">
              <thead><tr><th>Product</th><th>Stock</th><th>Sold</th></tr></thead>
              <tbody>
                {report.lowStock.map((row) => (
                  <tr key={row.id}><td>{row.emoji} {row.name}</td><td><span className={`pill ${row.stock <= 0 ? "bad" : ""}`}>{row.stock <= 0 ? "Sold out" : row.stock}</span></td><td>{row.sold}</td></tr>
                ))}
                {!report.lowStock.length ? <tr><td colSpan={3} className="muted">Every product has more than 10 in stock.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="report-card">
        <div className="report-head"><h3>Recent orders</h3><Link className="muted" href="/admin/orders">All orders →</Link></div>
        <div className="table-wrap flat">
          <table className="data">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>City</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {report.recent.map((row) => (
                <tr key={row.id}>
                  <td><b>{row.order_no}</b></td>
                  <td>{new Date(row.created_at).toLocaleDateString("en-PK")}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.city}</td>
                  <td>{String(row.payment_method).toUpperCase()}</td>
                  <td><span className={`pill ${row.status === "Delivered" ? "good" : row.status === "Cancelled" ? "bad" : ""}`}>{row.status}</span></td>
                  <td>{pkr(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, invert = false }) {
  const good = delta === null || delta === undefined ? null : invert ? delta <= 0 : delta >= 0;
  return (
    <div className="stat-card">
      <span className="muted">{label}</span>
      <b>{value}</b>
      {delta === null || delta === undefined ? <small className="muted">No earlier data</small> : (
        <small className={good ? "delta up" : "delta down"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs previous</small>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: 40, width: 280, marginBottom: 18 }} />
      <div className="kpi-grid">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton" style={{ height: 96 }} />)}</div>
      <div className="skeleton" style={{ height: 300, marginTop: 16 }} />
    </div>
  );
}
