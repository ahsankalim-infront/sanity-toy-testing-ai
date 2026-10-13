"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, pkr } from "../../../lib/format";
import SkillGame from "../../../components/SkillGame";

const WHEEL_COLORS = ["#FF6B00", "#FFD700", "#00C2CB", "#FF4FA3", "#7B4FFF", "#3BB273", "#FF8A3D", "#2D7FF9"];
const TX_LABELS = {
  game_win: "Game win",
  game_entry: "Game entry",
  signup_bonus: "Welcome bonus",
  order_redeem: "Used at checkout",
  order_refund: "Order refund",
  admin_adjust: "Kidlo adjustment",
};

function customerToken() {
  return typeof window === "undefined" ? "" : localStorage.getItem("kidlo_customer") || "";
}

function authHeaders() {
  const token = customerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function GamesPage() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await api("/api/games", { headers: authHeaders() });
    setData(result);
    setActive((current) => result.games.find((game) => game.id === current?.id) || result.games[0] || null);
    if (result.customer) {
      const me = await api("/api/me", { headers: authHeaders() });
      setHistory(me.transactions);
    }
  }, []);

  useEffect(() => {
    load().catch((err) => {
      if (/log in/i.test(err.message)) localStorage.removeItem("kidlo_customer");
      setError(err.message);
    });
  }, [load]);

  function updateBalance(balance) {
    setData((current) => ({ ...current, customer: { ...current.customer, coins: balance } }));
    try {
      const profile = JSON.parse(localStorage.getItem("kidlo_customer_profile") || "null");
      if (profile) localStorage.setItem("kidlo_customer_profile", JSON.stringify({ ...profile, coins: balance }));
    } catch { /* storage unavailable */ }
  }

  if (!data) {
    return <div className="page-body">{error ? <p className="note">{error}</p> : <div className="skeleton" style={{ height: 420 }} />}</div>;
  }

  const { rules, games, customer } = data;
  const coinValue = Number(rules.coin_value_pkr) || 0;

  return (
    <>
      <div className="page-hero games-hero">
        <div className="crumb"><Link href="/">Home</Link> / Play & Win</div>
        <div className="games-hero-row">
          <div>
            <h1>Play & win Kidlo Coins</h1>
            <p className="sec-sub">Play a quick game, collect coins, and use them as a discount on toys at checkout.</p>
          </div>
          {customer ? (
            <div className="coin-wallet">
              <span>🪙</span>
              <div><small>Your coins</small><b>{Number(customer.coins).toLocaleString("en-PK")}</b><em>Worth {pkr(customer.coins * coinValue)}</em></div>
            </div>
          ) : null}
        </div>
        <ul className="coin-rules">
          <li>1 coin = {pkr(coinValue)}</li>
          <li>Use coins for up to {rules.max_redeem_percent}% of an order</li>
          {rules.min_redeem_coins ? <li>Minimum {rules.min_redeem_coins} coins per order</li> : null}
          {rules.daily_play_limit ? <li>{rules.daily_play_limit} plays a day</li> : null}
          {rules.signup_bonus ? <li>{rules.signup_bonus} coins welcome bonus</li> : null}
        </ul>
      </div>

      <div className="page-body">
        {error ? <p className="note">{error}</p> : null}
        {!rules.enabled ? (
          <div className="form-card checkout-empty"><div className="big">⏸️</div><h2 className="sec-head">Games are paused</h2><p className="sec-sub">Kidlo Coins games are taking a short break. Check back soon.</p></div>
        ) : !customer ? (
          <div className="form-card games-login">
            <div className="big">🎮</div>
            <h2 className="sec-head">Log in to start playing</h2>
            <p className="sec-sub">Coins are saved to your Kidlo account so you can spend them at checkout.{rules.signup_bonus ? ` New accounts get ${rules.signup_bonus} coins to start.` : ""}</p>
            <Link className="btn btn-orange" href="/account?next=/games">Log in or create an account</Link>
          </div>
        ) : data.blocked ? (
          <div className="form-card checkout-empty"><div className="big">🔒</div><h2 className="sec-head">Games are off for this account</h2><p className="sec-sub">Contact Kidlo support if you think this is a mistake.</p></div>
        ) : !games.length ? (
          <div className="form-card checkout-empty"><div className="big">🎲</div><h2 className="sec-head">New games are coming</h2></div>
        ) : (
          <div className="games-layout">
            <div className="game-picker">
              {games.map((game) => {
                const left = game.daily_limit ? Math.max(0, game.daily_limit - game.played_today) : null;
                return (
                  <button type="button" key={game.id} className={active?.id === game.id ? "on" : ""} onClick={() => setActive(game)}>
                    <span className="game-emoji">{game.emoji}</span>
                    <span><strong>{game.name}</strong><small>{left === null ? "Unlimited plays" : `${left} of ${game.daily_limit} plays left today`}{game.cost_coins ? ` · ${game.cost_coins} coins per play` : " · Free"}</small></span>
                  </button>
                );
              })}
            </div>
            {active ? (
              <GameStage
                key={active.id}
                game={active}
                rules={rules}
                playsToday={data.plays_today}
                onResult={async (result) => {
                  updateBalance(result.balance);
                  await load();
                }}
              />
            ) : null}
          </div>
        )}

        {customer && history.length ? (
          <section className="form-card coin-history">
            <h2>Coin history</h2>
            <ul>
              {history.map((row) => (
                <li key={row.id}>
                  <span><strong>{TX_LABELS[row.type] || row.type}</strong><small>{row.note || row.reference} · {new Date(row.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</small></span>
                  <b className={row.coins >= 0 ? "plus" : "minus"}>{row.coins >= 0 ? "+" : ""}{row.coins}</b>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

function GameStage({ game, rules, playsToday, onResult }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const left = game.daily_limit ? game.daily_limit - game.played_today : Infinity;
  const globalLeft = rules.daily_play_limit ? rules.daily_play_limit - playsToday : Infinity;
  const canPlay = !busy && left > 0 && globalLeft > 0;

  async function play(reveal) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const outcome = await api(`/api/games/${game.id}/play`, { method: "POST", headers: authHeaders(), body: {} });
      await reveal(outcome);
      setResult(outcome);
      await onResult(outcome);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-card game-stage">
      <header>
        <h2>{game.emoji} {game.name}</h2>
        <p className="muted">{game.description}</p>
      </header>
      {game.type === "spin" ? <SpinWheel prizes={game.prizes} canPlay={canPlay} busy={busy} onPlay={play} /> : null}
      {game.type === "box" ? <MysteryBoxes canPlay={canPlay} busy={busy} onPlay={play} /> : null}
      {game.type === "snake" || game.type === "cars" ? (
        <SkillGame game={game} canPlay={canPlay && !result} onFinish={async (outcome) => { setResult(outcome); await onResult(outcome); }} />
      ) : null}
      {result ? (
        <div className={`game-result ${result.prize.coins ? "win" : "lose"}`} role="status">
          {result.prize.coins ? <><b>🎉 You won {result.prize.coins} coins!</b><span>{result.score !== undefined ? `Score ${result.score}. ` : ""}Your balance is now {result.balance.toLocaleString("en-PK")} coins.</span></> : <><b>{result.prize.label}</b><span>No coins this time. Try another game or come back tomorrow.</span></>}
        </div>
      ) : null}
      {error ? <p className="checkout-note bad">{error}</p> : null}
      {!canPlay && !busy && !result ? <p className="checkout-note bad">{globalLeft <= 0 ? "You have used all your plays for today. Come back tomorrow." : "You have used all plays of this game today. Try another game."}</p> : null}
    </section>
  );
}

function SpinWheel({ prizes, canPlay, busy, onPlay }) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const slice = 360 / prizes.length;
  const gradient = prizes.map((_, index) => `${WHEEL_COLORS[index % WHEEL_COLORS.length]} ${index * slice}deg ${(index + 1) * slice}deg`).join(",");

  function spin() {
    onPlay((outcome) => new Promise((resolve) => {
      const center = outcome.index * slice + slice / 2;
      const current = rotationRef.current;
      const target = (360 - center) % 360;
      const next = current + 360 * 6 + ((target - (current % 360)) + 360) % 360;
      rotationRef.current = next;
      setRotation(next);
      setTimeout(resolve, 4300);
    }));
  }

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer" aria-hidden>▼</div>
      <div className="wheel" style={{ background: `conic-gradient(${gradient})`, transform: `rotate(${rotation}deg)` }}>
        {prizes.map((prize, index) => (
          <span key={index} className="wheel-label" style={{ transform: `rotate(${index * slice + slice / 2}deg)` }}><em>{prize.label}</em></span>
        ))}
        <div className="wheel-hub">🪙</div>
      </div>
      <button className="btn btn-orange game-play-btn" type="button" disabled={!canPlay} onClick={spin}>{busy ? "Spinning…" : "Spin the wheel"}</button>
    </div>
  );
}

function MysteryBoxes({ canPlay, busy, onPlay }) {
  const [picked, setPicked] = useState(null);
  const [opened, setOpened] = useState(null);

  function choose(index) {
    if (!canPlay) return;
    setPicked(index);
    setOpened(null);
    onPlay((outcome) => new Promise((resolve) => {
      setTimeout(() => { setOpened(outcome.prize); resolve(); }, 900);
    }));
  }

  return (
    <div className="boxes-wrap">
      <p className="muted">{busy ? "Opening your box…" : "Pick a box to open it."}</p>
      <div className="boxes">
        {[0, 1, 2].map((index) => (
          <button type="button" key={index} disabled={!canPlay && picked !== index} className={`mystery-box ${picked === index ? (opened ? "open" : "shake") : ""} ${picked !== null && picked !== index ? "dim" : ""}`} onClick={() => choose(index)} aria-label={`Open box ${index + 1}`}>
            <span className="box-face">{picked === index && opened ? (opened.coins ? "🪙" : "💨") : "🎁"}</span>
            <span className="box-label">{picked === index && opened ? opened.label : `Box ${index + 1}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
