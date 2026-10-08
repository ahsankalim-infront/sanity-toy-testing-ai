"use client";

import { useState } from "react";
import { api } from "../lib/format";

export default function InquiryForm({ type = "contact" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [note, setNote] = useState("");

  async function submit(event) {
    event.preventDefault();
    try {
      await api("/api/inquiries", { method: "POST", body: { ...form, type } });
      setNote("Received. We reply within one working day.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setNote(err.message);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="field"><label>Name</label><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
      <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
      <div className="field"><label>Phone</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
      <div className="field"><label>Message</label><textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></div>
      <button className="btn btn-orange" type="submit">Send</button>
      {note ? <p className="muted" style={{ marginTop: 10 }}>{note}</p> : null}
    </form>
  );
}
