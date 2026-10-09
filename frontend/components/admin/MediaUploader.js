"use client";

import { useEffect, useRef, useState } from "react";
import { adminHeaders } from "./AdminShell";
import { api } from "../../lib/format";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function MediaUploader({ onUploaded, compact = false }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [altText, setAltText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function choose(nextFile) {
    setNote("");
    if (!nextFile) return;
    if (!ACCEPTED.includes(nextFile.type)) return setNote("Choose a JPG, PNG, WebP, or GIF image.");
    if (nextFile.size > 5 * 1024 * 1024) return setNote("Image must be 5 MB or smaller.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    if (!altText) setAltText(nextFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setNote("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!file) return setNote("Choose an image first.");
    setBusy(true);
    setNote("");
    const form = new FormData();
    form.append("file", file);
    form.append("alt_text", altText.trim());
    try {
      const { media } = await api("/api/admin/media/upload", { method: "POST", headers: adminHeaders(), body: form });
      setNote("Image uploaded successfully.");
      setFile(null);
      setPreview("");
      setAltText("");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.(media);
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`media-uploader ${compact ? "compact" : ""}`}>
      <input ref={inputRef} className="media-file-input" type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={(event) => choose(event.target.files?.[0])} />
      <button
        className={`media-drop ${dragging ? "dragging" : ""}`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]); }}
      >
        {preview ? <img src={preview} alt="Selected upload preview" /> : <span className="media-drop-icon">🖼️</span>}
        <span><strong>{file ? file.name : "Drop a product image here"}</strong><small>or click to browse · JPG, PNG, WebP or GIF · max 5 MB</small></span>
      </button>
      {file ? (
        <div className="media-upload-actions">
          <div className="field"><label>Image alt text</label><input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the product for accessibility" /></div>
          <button className="btn btn-orange" type="button" disabled={busy} onClick={upload}>{busy ? "Uploading…" : "Upload image"}</button>
          <button className="btn btn-outline" type="button" disabled={busy} onClick={clear}>Cancel</button>
        </div>
      ) : null}
      {note ? <p className={note.includes("successfully") ? "media-note good" : "media-note"}>{note}</p> : null}
    </div>
  );
}
