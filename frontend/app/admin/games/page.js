"use client";

import { useState } from "react";
import { adminHeaders, useAdminRows } from "../../../components/admin/AdminShell";
import { api } from "../../../lib/format";

const TYPES = [["spin", "Spin the wheel"], ["box", "Mystery box"], ["snake", "Snake"], ["cars", "Toy cars"]];
const SKILL = new Set(["snake", "cars"]);
const BLANK = {
  slug: "", name: "", type: "spin", emoji: "🎡", description: "", cost_coins: 0, daily_limit: 3, enabled: 1, sort_order: 10,
  prizes: [
    { label: "10 coins", coins: 10, weight: 50 },
    { label: "Try again", coins: 0, weight: 50 },
  ],
};

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function expectedCoins(prizes) {
  const total = prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.weight) || 0), 0);
  if (!total) return 0;
  return prizes.reduce((sum, prize) => sum + (Math.max(0, Number(prize.weight) || 0) / total) * (Number(prize.coins) || 0), 0);
}

export default function GamesAdmin() {
  const { rows, error, reload } = useAdminRows("games");
  const plays = useAdminRows("game_plays");
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState("");
  const games = [...rows].sort((a, b) => a.sort_order - b.sort_order);

  function edit(row) {
    setDraft(JSON.parse(JSON.stringify(row)));
    setNote("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setPrize(index, key, value) {
    setDraft({ ...draft, prizes: draft.prizes.map((prize, i) => (i === index ? { ...prize, [key]: value } : prize)) });
  }

  async function save(event) {
    event.preventDefault();
    const body = { ...draft, slug: draft.slug || slugify(draft.name) };
    const skill = SKILL.has(body.type);
    if (!body.prizes.length) return setNote("Add at least one prize.");
    if (!skill && !body.prizes.some((prize) => Number(prize.weight) > 0)) return setNote("At least one prize needs a chance above 0.");
    if (skill && body.prizes.some((prize) => prize.min_score === undefined || prize.min_score === "")) return setNote("Every score prize needs a minimum score.");
    try {
      if (body.id) await api(`/api/admin/games/${body.id}`, { method: "PUT", headers: adminHeaders(), body });
      else await api("/api/admin/games", { method: "POST", headers: adminHeaders(), body });
      setDraft(null);
      setNote("Game saved.");
      await reload();
    } catch (err) {
      setNote(err.message);
    }
  }

  async function toggle(row) {
    await api(`/api/admin/games/${row.id}`, { method: "PUT", headers: adminHeaders(), body: { ...row, enabled: row.enabled ? 0 : 1 } });
    await reload();
  }

  async function remove(row) {
    if (!confirm(`Delete ${row.name}? Play history stays in the coin ledger.`)) return;
    await api(`/api/admin/games/${row.id}`, { method: "DELETE", headers: adminHeaders() });
    await reload();
  }

  const totalWeight = draft ? draft.prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.weight) || 0), 0) : 0;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="sec-head" style={{ fontSize: 34 }}>Games</h1>
          <p className="muted" style={{ maxWidth: 760 }}>Set up the games customers play to win Kidlo Coins. Every result is drawn on the server using the prize chances below, so customers cannot change the outcome.</p>
        </div>
        <button className="btn btn-orange" type="button" onClick={() => edit(BLANK)}>+ Add game</button>
      </div>
      {error ? <p className="note">{error}</p> : null}
      {note ? <p className="note">{note}</p> : null}

      {draft ? (
        <form className="form-card admin-record-form" onSubmit={save}>
          <div className="admin-record-form-head">
            <h2>{draft.id ? `Edit ${draft.name}` : "New game"}</h2>
            <div className="row-actions">
              <button className="btn btn-outline" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-orange" type="submit">Save game</button>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="field"><label>Name</label><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
            <div className="field"><label>Game type</label><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="field"><label>Emoji</label><input value={draft.emoji} onChange={(event) => setDraft({ ...draft, emoji: event.target.value })} /></div>
            <div className="field"><label>Slug</label><input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} placeholder={slugify(draft.name)} /></div>
            <div className="field wide"><label>Description</label><textarea rows={2} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div>
            <div className="field"><label>Coins to play</label><input type="number" min={0} value={draft.cost_coins} onChange={(event) => setDraft({ ...draft, cost_coins: Number(event.target.value) })} /><p className="admin-help">0 makes the game free.</p></div>
            <div className="field"><label>Plays per customer per day</label><input type="number" min={0} value={draft.daily_limit} onChange={(event) => setDraft({ ...draft, daily_limit: Number(event.target.value) })} /><p className="admin-help">Spin the wheel and the gift box are 1 play each per day. Set 0 to remove this game's own cap.</p></div>
            <div className="field"><label>Sort order</label><input type="number" value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })} /></div>
            <div className="field"><label className="toggle-line"><input type="checkbox" checked={Boolean(draft.enabled)} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked ? 1 : 0 })} /><span>Live on the storefront</span></label></div>
          </div>

          <div className="prize-editor">
            <div className="prize-editor-head">
              <h3>{SKILL.has(draft.type) ? "Score prizes" : "Prizes"}</h3>
              {SKILL.has(draft.type) ? <span className="pill">Top prize {draft.prizes.length ? Math.max(...draft.prizes.map((prize) => Number(prize.coins) || 0)) : 0} coins</span> : <span className="pill">Average payout {expectedCoins(draft.prizes).toFixed(1)} coins per play</span>}
            </div>
            {SKILL.has(draft.type) ? (
              <>
                <div className="prize-row skill prize-row-head"><span>Label</span><span>Coins</span><span>Score needed</span><span /></div>
                {draft.prizes.map((prize, index) => (
                  <div className="prize-row skill" key={index}>
                    <input aria-label="Prize label" value={prize.label} onChange={(event) => setPrize(index, "label", event.target.value)} />
                    <input aria-label="Coins" type="number" min={0} value={prize.coins} onChange={(event) => setPrize(index, "coins", Number(event.target.value))} />
                    <input aria-label="Score needed" type="number" min={0} value={prize.min_score ?? 0} onChange={(event) => setPrize(index, "min_score", Number(event.target.value))} />
                    <button className="text-btn" type="button" onClick={() => setDraft({ ...draft, prizes: draft.prizes.filter((_, i) => i !== index) })}>Remove</button>
                  </div>
                ))}
                <button className="btn btn-teal" type="button" onClick={() => setDraft({ ...draft, prizes: [...draft.prizes, { label: "New score", coins: 10, min_score: 0 }] })}>+ Add score prize</button>
                <p className="admin-help">The player earns the prize with the highest score they reached. Snake scores apples. Toy Cars scores metres driven.</p>
              </>
            ) : (
              <>
                <div className="prize-row prize-row-head"><span>Label</span><span>Coins</span><span>Chance weight</span><span>Win chance</span><span /></div>
                {draft.prizes.map((prize, index) => (
                  <div className="prize-row" key={index}>
                    <input aria-label="Prize label" value={prize.label} onChange={(event) => setPrize(index, "label", event.target.value)} />
                    <input aria-label="Coins" type="number" min={0} value={prize.coins} onChange={(event) => setPrize(index, "coins", Number(event.target.value))} />
                    <input aria-label="Chance weight" type="number" min={0} value={prize.weight} onChange={(event) => setPrize(index, "weight", Number(event.target.value))} />
                    <b>{totalWeight ? `${((Math.max(0, Number(prize.weight) || 0) / totalWeight) * 100).toFixed(1)}%` : "0%"}</b>
                    <button className="text-btn" type="button" onClick={() => setDraft({ ...draft, prizes: draft.prizes.filter((_, i) => i !== index) })}>Remove</button>
                  </div>
                ))}
                <button className="btn btn-teal" type="button" onClick={() => setDraft({ ...draft, prizes: [...draft.prizes, { label: "Try again", coins: 0, weight: 10 }] })}>+ Add prize</button>
                <p className="admin-help">A prize with 0 coins counts as a loss. Spin wheels show each prize as one slice, in this order. Set plays per day to 1 for a once-a-day game.</p>
              </>
            )}
          </div>
        </form>
      ) : null}

      {games.length ? (
        <div className="admin-record-list">
          {games.map((row) => {
            const gamePlays = plays.rows.filter((play) => Number(play.game_id) === Number(row.id));
            const paid = gamePlays.reduce((sum, play) => sum + Number(play.coins_won || 0), 0);
            return (
              <article className="admin-record" key={row.id}>
                <div className="admin-record-mark">{row.emoji || "🎮"}</div>
                <div className="admin-record-main">
                  <strong>{row.name}</strong>
                  <span>{TYPES.find(([value]) => value === row.type)?.[1] || row.type} · {row.daily_limit ? `${row.daily_limit} per day` : "No daily cap"}</span>
                </div>
                <div className="admin-record-meta">
                  <div><small>Status</small><b><span className={`pill ${row.enabled ? "good" : "bad"}`}>{row.enabled ? "Live" : "Hidden"}</span></b></div>
                  <div><small>Plays</small><b>{gamePlays.length.toLocaleString("en-PK")}</b></div>
                  <div><small>Coins paid out</small><b>{paid.toLocaleString("en-PK")}</b></div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-outline" type="button" onClick={() => edit(row)}>Edit</button>
                  <button className="btn btn-outline" type="button" onClick={() => toggle(row)}>{row.enabled ? "Hide" : "Go live"}</button>
                  <button className="text-btn" type="button" onClick={() => remove(row)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : <div className="empty form-card"><div className="big">🎮</div><h2>No games yet</h2><p className="muted">Add a spin wheel or mystery box to start rewarding customers.</p></div>}
    </>
  );
}
