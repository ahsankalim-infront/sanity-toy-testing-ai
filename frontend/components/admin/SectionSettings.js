"use client";

import { useEffect, useState } from "react";
import { adminHeaders, useAdminRows } from "./AdminShell";
import { api } from "../../lib/format";

export default function SectionSettings({ sectionKey, title, fields, enabledLabel = "Turned on", onSaved, children }) {
  const { rows, error, reload } = useAdminRows("sections");
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState("");
  const row = rows.find((item) => item.section_key === sectionKey);

  useEffect(() => {
    if (row) setDraft(JSON.parse(JSON.stringify(row)));
  }, [row?.id, row?.updated_at]);

  if (error) return <p className="note">{error}</p>;
  if (!draft) return <div className="skeleton" style={{ height: 240 }} />;

  function setField(key, value) {
    setDraft({ ...draft, payload: { ...draft.payload, [key]: value } });
  }

  async function save(event) {
    event.preventDefault();
    try {
      await api(`/api/admin/sections/${draft.id}`, { method: "PUT", headers: adminHeaders(), body: draft });
      setNote("Saved. The storefront uses these settings now.");
      await reload();
      onSaved?.(draft);
    } catch (err) {
      setNote(err.message);
    }
  }

  return (
    <form className="form-card admin-record-form" onSubmit={save}>
      <div className="admin-record-form-head">
        <h2>{title}</h2>
        <div className="row-actions">
          <label className="toggle-line">
            <input type="checkbox" checked={Boolean(Number(draft.enabled))} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked ? 1 : 0 })} />
            <span>{enabledLabel}</span>
          </label>
          <button className="btn btn-orange" type="submit">Save settings</button>
        </div>
      </div>
      {note ? <p className="note">{note}</p> : null}
      <div className="admin-form-grid">
        {fields.map((field) => (
          <div className={`field ${field.wide ? "wide" : ""}`} key={field.key}>
            {field.type === "toggle" ? (
              <label className="toggle-line">
                <input type="checkbox" checked={Boolean(Number(draft.payload?.[field.key]))} onChange={(event) => setField(field.key, event.target.checked ? 1 : 0)} />
                <span>{field.label}</span>
              </label>
            ) : (
              <>
                <label>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea rows={3} value={draft.payload?.[field.key] ?? ""} onChange={(event) => setField(field.key, event.target.value)} placeholder={field.placeholder} />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "password" ? "password" : "text"}
                    min={field.min}
                    max={field.max}
                    value={draft.payload?.[field.key] ?? ""}
                    onChange={(event) => setField(field.key, field.type === "number" ? Number(event.target.value) : event.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </>
            )}
            {field.help ? <p className="admin-help">{field.help}</p> : null}
          </div>
        ))}
      </div>
      {children ? children(draft) : null}
    </form>
  );
}
