"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../lib/format";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@kidlo.pk");
  const [password, setPassword] = useState("kidlo123");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    try {
      const data = await api("/api/admin/login", { method: "POST", body: { email, password } });
      localStorage.setItem("kidlo_admin", data.token);
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <p className="pcard-tag">Kidlo control room</p>
        <h1 className="sec-head" style={{ fontSize: 36 }}>Admin login</h1>
        <div className="field"><label>Email</label><input value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        {error ? <p className="muted">{error}</p> : null}
        <button className="btn btn-orange" type="submit">Enter</button>
      </form>
    </div>
  );
}
