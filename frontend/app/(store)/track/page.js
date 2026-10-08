"use client";

import { useState } from "react";
import { api, pkr } from "../../../lib/format";

export default function TrackPage() {
  const [form, setForm] = useState({ order_no: "KD1001", phone: "03001234567" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      setResult(await api("/api/orders/track", { method: "POST", body: form }));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-hero">
        <h1>Track My Order</h1>
        <p className="sec-sub">Use the order number from checkout and the phone you entered. Try KD1001 / 03001234567.</p>
      </div>
      <div className="page-body split">
        <form className="form-card" onSubmit={submit}>
          <div className="field"><label>Order number</label><input value={form.order_no} onChange={(event) => setForm({ ...form, order_no: event.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <button className="btn btn-orange" type="submit">Track</button>
          {error ? <p className="muted" style={{ marginTop: 10 }}>{error}</p> : null}
        </form>
        {result ? (
          <div className="form-card">
            <span className="pill">{result.order.status}</span>
            <h2 className="sec-head" style={{ fontSize: 32 }}>{result.order.order_no}</h2>
            <p>{result.order.customer_name} · {result.order.city}</p>
            <p className="muted">{result.order.address}</p>
            {result.items.map((item) => <div className="summary-line" key={item.id}><span>{item.emoji} {item.name} × {item.qty}</span><span>{pkr(item.price * item.qty)}</span></div>)}
            <div className="summary-line total"><span>Total</span><span>{pkr(result.order.total)}</span></div>
          </div>
        ) : null}
      </div>
    </>
  );
}
