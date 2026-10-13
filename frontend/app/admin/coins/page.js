"use client";

import { useEffect, useMemo, useState } from "react";
import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import SectionSettings from "../../../components/admin/SectionSettings";
import { api, pkr } from "../../../lib/format";

const PAGE_SIZE = 15;
const RULE_FIELDS = [
  { key: "enabled", label: "Customers can play games and use coins", type: "toggle", wide: true },
  { key: "coin_value_pkr", label: "Value of 1 coin (PKR)", type: "number", min: 0 },
  { key: "max_redeem_percent", label: "Max share of an order paid with coins (%)", type: "number", min: 0, max: 100 },
  { key: "min_redeem_coins", label: "Minimum coins per order", type: "number", min: 0 },
  { key: "signup_bonus", label: "Welcome bonus for new accounts", type: "number", min: 0 },
  { key: "daily_play_limit", label: "Plays per customer per day (all games)", type: "number", min: 0, help: "0 means only each game's own limit applies." },
];
const TX_LABELS = {
  game_win: "Game win", game_entry: "Game entry", signup_bonus: "Welcome bonus", order_redeem: "Used on order", order_refund: "Order refund", admin_adjust: "Admin adjustment",
};
const date = (value) => new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

export default function CoinsAdmin() {
  const [tab, setTab] = useState("customers");
  const [summary, setSummary] = useState(null);
  const customers = useAdminRows("customers");
  const ledger = useAdminRows("coin_transactions");
  const plays = useAdminRows("game_plays");

  async function loadSummary() {
    setSummary(await api("/api/admin/coins/summary", { headers: adminHeaders() }));
  }
  useEffect(() => { loadSummary().catch(() => {}); }, []);

  async function refresh() {
    await Promise.all([customers.reload(), ledger.reload(), plays.reload(), loadSummary()]);
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Kidlo Coins</h1>
          <p className="muted" style={{ maxWidth: 760 }}>Customers log in, play games, win coins, and spend them at checkout. Set the rules, adjust balances, and review every coin movement here.</p>
        </div>
      </div>

      {summary ? (
        <div className="kpi-grid">
          <Stat label="Coins in wallets" value={summary.outstanding.toLocaleString("en-PK")} sub={`Worth ${pkr(summary.outstanding * summary.rules.coin_value_pkr)}`} />
          <Stat label="Coins issued" value={summary.issued.toLocaleString("en-PK")} />
          <Stat label="Coins redeemed" value={summary.redeemed.toLocaleString("en-PK")} sub={`${pkr(summary.redeemed * summary.rules.coin_value_pkr)} in discounts`} />
          <Stat label="Game plays" value={summary.plays.toLocaleString("en-PK")} sub={`${summary.wins} wins`} />
          <Stat label="Players" value={summary.players.toLocaleString("en-PK")} />
          <Stat label="Status" value={summary.rules.enabled ? "Live" : "Paused"} />
        </div>
      ) : null}

      <SectionSettings sectionKey="coins" title="Coin rules" fields={RULE_FIELDS} enabledLabel="Coins section active" onSaved={loadSummary} />

      <div className="product-admin-toolbar">
        <div className="seg">
          {[["customers", "Customer wallets"], ["ledger", "Coin ledger"], ["plays", "Game plays"]].map(([value, label]) => (
            <button key={value} type="button" className={tab === value ? "on" : ""} onClick={() => setTab(value)}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "customers" ? <Wallets rows={customers.rows} error={customers.error} onChanged={refresh} /> : null}
      {tab === "ledger" ? <Ledger rows={ledger.rows} /> : null}
      {tab === "plays" ? <Plays rows={plays.rows} /> : null}
    </>
  );
}

function Stat({ label, value, sub }) {
  return <div className="stat-card"><span className="muted">{label}</span><b>{value}</b>{sub ? <small className="muted">{sub}</small> : null}</div>;
}

function usePaged(rows, query, keys) {
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((row) => keys.map((key) => row[key]).join(" ").toLowerCase().includes(q)) : rows;
  }, [rows, query, keys]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  return { filtered, visible: filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), pages, current, setPage };
}

function Pager({ paged }) {
  if (paged.pages <= 1) return null;
  return (
    <div className="admin-pager">
      <button className="btn btn-outline" type="button" disabled={paged.current === 1} onClick={() => paged.setPage(paged.current - 1)}>Previous</button>
      <span>Page {paged.current} of {paged.pages}</span>
      <button className="btn btn-outline" type="button" disabled={paged.current === paged.pages} onClick={() => paged.setPage(paged.current + 1)}>Next</button>
    </div>
  );
}

const WALLET_KEYS = ["name", "email", "phone"];
function Wallets({ rows, error, onChanged }) {
  const [query, setQuery] = useState("");
  const [adjusting, setAdjusting] = useState(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const sorted = useMemo(() => [...rows].sort((a, b) => (Number(b.coins) || 0) - (Number(a.coins) || 0)), [rows]);
  const paged = usePaged(sorted, query, WALLET_KEYS);

  async function adjust(event) {
    event.preventDefault();
    try {
      const result = await api(`/api/admin/customers/${adjusting.id}/coins`, { method: "POST", headers: adminHeaders(), body: { coins: amount, note: reason } });
      setNote(`${adjusting.name} now has ${result.balance} coins.`);
      setAdjusting(null);
      await onChanged();
    } catch (err) {
      setNote(err.message);
    }
  }

  async function toggleBlock(row) {
    await api(`/api/admin/customers/${row.id}`, { method: "PUT", headers: adminHeaders(), body: { games_blocked: row.games_blocked ? 0 : 1 } });
    await onChanged();
  }

  return (
    <>
      {error ? <p className="note">{error}</p> : null}
      {note ? <p className="note">{note}</p> : null}
      <div className="product-admin-toolbar">
        <div className="nav-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); paged.setPage(1); }} placeholder="Search customers" aria-label="Search customers" /></div>
        <span>{paged.filtered.length} customers</span>
      </div>
      {adjusting ? (
        <form className="form-card admin-record-form" onSubmit={adjust}>
          <div className="admin-record-form-head">
            <h2>Adjust coins for {adjusting.name}</h2>
            <div className="row-actions">
              <button className="btn btn-outline" type="button" onClick={() => setAdjusting(null)}>Cancel</button>
              <button className="btn btn-orange" type="submit" disabled={!amount}>Apply</button>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="field"><label>Coins to add or remove</label><input type="number" value={amount} onChange={(event) => setAmount(Math.trunc(Number(event.target.value)))} /><p className="admin-help">Current balance {adjusting.coins}. Use a negative number to remove coins.</p></div>
            <div className="field"><label>Reason</label><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Goodwill credit for late delivery" /></div>
          </div>
        </form>
      ) : null}
      {paged.visible.length ? (
        <div className="admin-record-list">
          {paged.visible.map((row) => (
            <article className="admin-record" key={row.id}>
              <div className="admin-record-mark">🪙</div>
              <div className="admin-record-main"><strong>{row.name}</strong><span>{row.email}{row.phone ? ` · ${row.phone}` : ""}</span></div>
              <div className="admin-record-meta">
                <div><small>Coins</small><b>{Number(row.coins || 0).toLocaleString("en-PK")}</b></div>
                <div><small>Games</small><b><span className={`pill ${row.games_blocked ? "bad" : "good"}`}>{row.games_blocked ? "Blocked" : "Allowed"}</span></b></div>
                <div><small>Joined</small><b>{row.created_at ? new Date(row.created_at).toLocaleDateString("en-PK") : "—"}</b></div>
              </div>
              <div className="row-actions">
                <button className="btn btn-outline" type="button" onClick={() => { setAdjusting(row); setAmount(0); setReason(""); setNote(""); }}>Adjust coins</button>
                <button className="text-btn" type="button" onClick={() => toggleBlock(row)}>{row.games_blocked ? "Allow games" : "Block games"}</button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty form-card"><div className="big">👤</div><h2>No customers yet</h2><p className="muted">Customer wallets appear after people create an account.</p></div>}
      <Pager paged={paged} />
    </>
  );
}

const LEDGER_KEYS = ["customer_name", "type", "reference", "note"];
function Ledger({ rows }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const sorted = useMemo(() => [...rows].filter((row) => type === "all" || row.type === type).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), [rows, type]);
  const paged = usePaged(sorted, query, LEDGER_KEYS);
  return (
    <>
      <div className="product-admin-toolbar">
        <div className="nav-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); paged.setPage(1); }} placeholder="Search customer, order, or note" aria-label="Search ledger" /></div>
        <select value={type} onChange={(event) => { setType(event.target.value); paged.setPage(1); }} aria-label="Movement type">
          <option value="all">All movements</option>
          {Object.entries(TX_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span>{paged.filtered.length} movements</span>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Customer</th><th>Type</th><th>Coins</th><th>Balance</th><th>Details</th></tr></thead>
          <tbody>
            {paged.visible.map((row) => (
              <tr key={row.id}>
                <td>{date(row.created_at)}</td>
                <td>{row.customer_name}</td>
                <td>{TX_LABELS[row.type] || row.type}</td>
                <td><b className={row.coins >= 0 ? "coin-plus" : "coin-minus"}>{row.coins >= 0 ? "+" : ""}{row.coins}</b></td>
                <td>{row.balance_after}</td>
                <td>{row.note || row.reference || "—"}</td>
              </tr>
            ))}
            {!paged.visible.length ? <tr><td colSpan={6}>No coin movements yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Pager paged={paged} />
    </>
  );
}

const PLAY_KEYS = ["customer_name", "game_name", "prize_label"];
function Plays({ rows }) {
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), [rows]);
  const paged = usePaged(sorted, query, PLAY_KEYS);
  return (
    <>
      <div className="product-admin-toolbar">
        <div className="nav-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); paged.setPage(1); }} placeholder="Search player or game" aria-label="Search plays" /></div>
        <span>{paged.filtered.length} plays</span>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Customer</th><th>Game</th><th>Score</th><th>Result</th><th>Coins won</th></tr></thead>
          <tbody>
            {paged.visible.map((row) => (
              <tr key={row.id}>
                <td>{date(row.created_at)}</td>
                <td>{row.customer_name}</td>
                <td>{row.game_name}</td>
                <td>{row.score || "—"}</td>
                <td><span className={`pill ${row.result === "win" ? "good" : ""}`}>{row.prize_label}</span></td>
                <td>{row.coins_won}</td>
              </tr>
            ))}
            {!paged.visible.length ? <tr><td colSpan={6}>No games played yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Pager paged={paged} />
    </>
  );
}
