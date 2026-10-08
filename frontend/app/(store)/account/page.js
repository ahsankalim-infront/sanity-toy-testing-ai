"use client";

import { useEffect, useState } from "react";
import { api, pkr } from "../../../lib/format";

export default function AccountPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  async function load(token) {
    const data = await api("/api/auth/orders", { headers: { Authorization: `Bearer ${token}` } });
    setOrders(data.orders);
  }

  useEffect(() => {
    const token = localStorage.getItem("kidlo_customer");
    const saved = localStorage.getItem("kidlo_customer_profile");
    if (token && saved) {
      setCustomer(JSON.parse(saved));
      load(token).catch(() => localStorage.removeItem("kidlo_customer"));
    }
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const data = await api(path, { method: "POST", body: form });
      localStorage.setItem("kidlo_customer", data.token);
      localStorage.setItem("kidlo_customer_profile", JSON.stringify(data.customer));
      setCustomer(data.customer);
      await load(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("kidlo_customer");
    localStorage.removeItem("kidlo_customer_profile");
    setCustomer(null);
    setOrders([]);
  }

  if (!customer) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={submit}>
          <h1 className="sec-head" style={{ fontSize: 36 }}>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          {mode === "register" ? <div className="field"><label>Name</label><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div> : null}
          <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          {mode === "register" ? <div className="field"><label>Phone</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div> : null}
          <div className="field"><label>Password</label><input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
          {error ? <p className="muted">{error}</p> : null}
          <button className="btn btn-orange" type="submit">{mode === "login" ? "Login" : "Register"}</button>
          <p style={{ marginTop: 12 }}><button type="button" className="btn btn-outline" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Need an account?" : "Have an account?"}</button></p>
        </form>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="sec-header-row">
        <h1 className="sec-head">Hi, {customer.name}</h1>
        <button className="btn btn-outline" onClick={logout}>Log out</button>
      </div>
      <p className="sec-sub">Orders placed with {customer.email} show up here. Guest checkouts appear when the same email was used.</p>
      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table className="data">
          <thead><tr><th>Order</th><th>Status</th><th>City</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}><td>{order.order_no}</td><td>{order.status}</td><td>{order.city}</td><td>{pkr(order.total)}</td></tr>
            ))}
            {!orders.length ? <tr><td colSpan={4}>No orders yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
