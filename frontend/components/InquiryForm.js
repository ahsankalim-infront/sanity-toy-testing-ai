"use client";

import { useState } from "react";
import { api } from "../lib/format";

export default function InquiryForm({ type = "contact" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [note, setNote] = useState("");
  const labels = {
    careers: ["Application details", "Tell us the role, your experience, city, and a link to your CV."],
    wholesale: ["Business requirements", "Include your business type, city, products, quantities, and target date."],
    bulk: ["Order requirements", "Include the event date, city, age group, budget, and estimated quantity."],
    "gift-card": ["Gift card request", "Include the amount, recipient name, phone, and delivery date."],
    contact: ["How can we help?", "Add an order number if your message is about an existing order."],
  };
  const [messageLabel, messageHint] = labels[type] || labels.contact;

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
    <form className="form-card inquiry-form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label htmlFor={`${type}-name`}>Full name</label><input id={`${type}-name`} required autoComplete="name" placeholder="Your full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
        <div className="field"><label htmlFor={`${type}-phone`}>Phone number</label><input id={`${type}-phone`} inputMode="tel" autoComplete="tel" placeholder="03xx xxx xxxx" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
      </div>
      <div className="field"><label htmlFor={`${type}-email`}>Email address</label><input id={`${type}-email`} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
      <div className="field"><label htmlFor={`${type}-message`}>{messageLabel}</label><textarea id={`${type}-message`} required rows={6} placeholder={messageHint} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></div>
      <div className="inquiry-submit">
        <button className="btn btn-orange" type="submit">Send message</button>
        <small>We use your details only to respond to this inquiry.</small>
      </div>
      {note ? <p className="inquiry-note">{note}</p> : null}
    </form>
  );
}
