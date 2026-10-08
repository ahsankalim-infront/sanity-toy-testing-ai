"use client";

import { useState } from "react";
import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import { api } from "../../../lib/format";

export default function SectionsPage() {
  const { rows, error, reload } = useAdminRows("sections");
  const [current, setCurrent] = useState(null);
  const [note, setNote] = useState("");

  function open(row) {
    setCurrent(JSON.parse(JSON.stringify(row)));
    setNote("");
  }

  async function save(event) {
    event.preventDefault();
    try {
      await api(`/api/admin/sections/${current.id}`, { method: "PUT", headers: adminHeaders(), body: current });
      setNote(`${current.name} is live on the storefront.`);
      await reload();
    } catch (err) {
      setNote(err.message);
    }
  }

  return (
    <>
      <h1 className="sec-head" style={{ fontSize: 34 }}>Homepage sections</h1>
      <p className="sec-sub">Each block of the Kidlo homepage is a record. Turn it off, rewrite the copy, or change the hero, deals, ages, and footer.</p>
      {error ? <p>{error}</p> : null}
      <div className="editor" style={{ marginTop: 16 }}>
        <div className="editor-list">
          {rows.map((row) => (
            <button key={row.id} className={current?.id === row.id ? "on" : ""} onClick={() => open(row)}>
              {row.enabled ? "●" : "○"} {row.name}
            </button>
          ))}
        </div>
        {current ? (
          <form className="form-card" onSubmit={save}>
            <div className="field"><label>Name</label><input value={current.name} onChange={(event) => setCurrent({ ...current, name: event.target.value })} /></div>
            <div className="field"><label>Enabled</label>
              <select value={current.enabled} onChange={(event) => setCurrent({ ...current, enabled: Number(event.target.value) })}>
                <option value={1}>Visible</option>
                <option value={0}>Hidden</option>
              </select>
            </div>
            <PayloadEditor value={current.payload} onChange={(payload) => setCurrent({ ...current, payload })} />
            <button className="btn btn-orange" type="submit">Save section</button>
            {note ? <p className="muted" style={{ marginTop: 10 }}>{note}</p> : null}
          </form>
        ) : <p className="muted">Choose a section.</p>}
      </div>
    </>
  );
}

function PayloadEditor({ value, onChange, label }) {
  if (Array.isArray(value)) {
    const objects = value.some((item) => item && typeof item === "object");
    if (!objects) {
      return (
        <div className="field">
          {label ? <label>{label}</label> : null}
          <textarea rows={5} value={value.join("\n")} onChange={(event) => onChange(event.target.value.split("\n"))} />
        </div>
      );
    }
    return (
      <div className="field">
        {label ? <label>{label}</label> : null}
        {value.map((item, index) => (
          <div key={index} className="form-card" style={{ marginBottom: 10 }}>
            <PayloadEditor value={item} onChange={(next) => onChange(value.map((entry, i) => (i === index ? next : entry)))} />
            <button type="button" className="btn btn-outline" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove item</button>
          </div>
        ))}
        <button type="button" className="btn btn-teal" onClick={() => onChange([...value, blankLike(value[value.length - 1])])}>Add item</button>
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div>
        {Object.entries(value).map(([key, item]) => (
          <PayloadEditor key={key} label={key} value={item} onChange={(next) => onChange({ ...value, [key]: next })} />
        ))}
      </div>
    );
  }
  return (
    <div className="field">
      {label ? <label>{label}</label> : null}
      {typeof value === "number" ? (
        <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      ) : (
        <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

function blankLike(sample) {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample).map(([key, item]) => [key, blankLike(item)]));
  }
  if (typeof sample === "number") return 0;
  return "";
}
