"use client";

import { useState } from "react";
import { adminHeaders, useAdminRows } from "./AdminShell";
import { api } from "../../lib/format";

export default function ResourceManager({ table, title, columns, blank }) {
  const { rows, error, reload } = useAdminRows(table);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState("");

  function edit(row) {
    setDraft(JSON.parse(JSON.stringify(row)));
    setNote("");
  }

  async function save(event) {
    event.preventDefault();
    const body = { ...draft };
    try {
      event.currentTarget.querySelectorAll("textarea.json-box").forEach((box) => {
        body[box.dataset.key] = JSON.parse(box.value);
      });
      if (body.id) await api(`/api/admin/${table}/${body.id}`, { method: "PUT", headers: adminHeaders(), body });
      else await api(`/api/admin/${table}`, { method: "POST", headers: adminHeaders(), body });
      setDraft(null);
      setNote("Saved.");
      await reload();
    } catch (err) {
      setNote(err.message || "Check the form and try again.");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this record?")) return;
    await api(`/api/admin/${table}/${id}`, { method: "DELETE", headers: adminHeaders() });
    await reload();
  }

  return (
    <>
      <div className="admin-top">
        <h1 className="sec-head" style={{ fontSize: 34 }}>{title}</h1>
        <button className="btn btn-orange" onClick={() => edit({ ...blank })}>Add</button>
      </div>
      {error ? <p>{error}</p> : null}
      {note ? <p className="note">{note}</p> : null}
      <div className="table-wrap">
        <table className="data">
          <thead><tr>{columns.map((col) => <th key={col}>{col}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => <td key={col}>{preview(row[col])}</td>)}
                <td className="row-actions">
                  <button className="btn btn-outline" onClick={() => edit(row)}>Edit</button>
                  <button className="btn btn-outline" onClick={() => remove(row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {draft ? (
        <form className="form-card" style={{ marginTop: 16 }} key={draft.id || "new"} onSubmit={save}>
          <h2 className="sec-head" style={{ fontSize: 26 }}>{draft.id ? `Edit #${draft.id}` : "New record"}</h2>
          {Object.keys(blank).concat(Object.keys(draft).filter((key) => !(key in blank) && key !== "id")).map((key) => (
            <div className="field" key={key}>
              <label>{key}</label>
              <ValueField field={key} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} />
            </div>
          ))}
          <div className="row-actions">
            <button className="btn btn-orange" type="submit">Save</button>
            <button className="btn btn-outline" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      ) : null}
    </>
  );
}

function preview(value) {
  if (value && typeof value === "object") return JSON.stringify(value).slice(0, 80);
  const text = String(value ?? "");
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function ValueField({ field, value, onChange }) {
  if (value && typeof value === "object") {
    return <textarea className="json-box" data-key={field} rows={8} defaultValue={JSON.stringify(value, null, 2)} />;
  }
  if (typeof value === "number") return <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
  const text = value ?? "";
  if (String(text).length > 80) return <textarea rows={4} value={text} onChange={(event) => onChange(event.target.value)} />;
  return <input value={text} onChange={(event) => onChange(event.target.value)} />;
}
