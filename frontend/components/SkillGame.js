"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/format";

function authHeaders() {
  const token = typeof window === "undefined" ? "" : localStorage.getItem("kidlo_customer") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SkillGame({ game, canPlay, onFinish }) {
  const canvasRef = useRef(null);
  const stopRef = useRef(() => {});
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const unit = game.type === "cars" ? "m" : "apples";

  useEffect(() => () => stopRef.current(), []);

  async function begin() {
    setError("");
    try {
      const start = await api(`/api/games/${game.id}/play`, { method: "POST", headers: authHeaders(), body: { action: "start" } });
      setPhase("running");
      setScore(0);
      const canvas = canvasRef.current;
      const runner = game.type === "cars" ? runCars : runSnake;
      stopRef.current = runner(canvas, {
        onScore: setScore,
        onOver: async (finalScore) => {
          setPhase("over");
          setScore(finalScore);
          try {
            const outcome = await api(`/api/games/${game.id}/play`, { method: "POST", headers: authHeaders(), body: { action: "finish", play_id: start.play_id, score: finalScore } });
            await onFinish(outcome);
          } catch (err) {
            setError(err.message);
          }
        },
      });
    } catch (err) {
      setError(err.message);
    }
  }

  const targets = [...(game.prizes || [])].sort((a, b) => a.min_score - b.min_score);

  return (
    <div className="skill-game">
      <div className="skill-hud">
        <b>{phase === "ready" ? "Ready" : `${score} ${unit}`}</b>
        <span>{phase === "running" ? "Playing" : phase === "over" ? "Finished" : "Press start"}</span>
      </div>
      <div className="skill-canvas-wrap">
        <canvas ref={canvasRef} width="420" height="460" />
        {phase !== "running" ? (
        <div className="skill-overlay">
          <button className="btn btn-orange" type="button" disabled={!canPlay} onClick={begin}>
            {phase === "over" ? (canPlay ? "Play again" : "Played today") : (canPlay ? "Start" : "Come back tomorrow")}
          </button>
        </div>
        ) : null}
      </div>
      {game.type === "snake" ? <SnakePad /> : <CarPad />}
      <ul className="score-targets">
        {targets.map((prize) => (
          <li key={`${prize.min_score}-${prize.label}`} className={score >= prize.min_score && phase === "over" ? "hit" : ""}>
            <span>{prize.min_score ? `${prize.min_score}+ ${unit}` : "Any score"}</span>
            <b>{prize.coins} coins</b>
          </li>
        ))}
      </ul>
      <p className="admin-help">{game.type === "snake" ? "Swipe, tap the pad, or use the arrow keys." : "Tap the sides, use the buttons, or press the left and right arrow keys."}</p>
      {error ? <p className="checkout-note bad">{error}</p> : null}
    </div>
  );
}

function SnakePad() {
  function tap(key) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }
  return (
    <div className="skill-pad" aria-label="Snake controls">
      <span />
      <button type="button" onPointerDown={(event) => { event.preventDefault(); tap("ArrowUp"); }} aria-label="Up">↑</button>
      <span />
      <button type="button" onPointerDown={(event) => { event.preventDefault(); tap("ArrowLeft"); }} aria-label="Left">←</button>
      <button type="button" onPointerDown={(event) => { event.preventDefault(); tap("ArrowDown"); }} aria-label="Down">↓</button>
      <button type="button" onPointerDown={(event) => { event.preventDefault(); tap("ArrowRight"); }} aria-label="Right">→</button>
    </div>
  );
}

function CarPad() {
  function tap(key) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }
  return (
    <div className="car-pad">
      <button type="button" aria-label="Move left" onPointerDown={(event) => { event.preventDefault(); tap("ArrowLeft"); }}>← Left</button>
      <button type="button" aria-label="Move right" onPointerDown={(event) => { event.preventDefault(); tap("ArrowRight"); }}>Right →</button>
    </div>
  );
}

function fitCanvas(canvas) {
  const width = canvas.clientWidth || 420;
  const height = Math.round(width * (canvas.height / canvas.width));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function pointerSwipe(canvas, onDir) {
  let start = null;
  function down(event) {
    const point = event.touches ? event.touches[0] : event;
    start = { x: point.clientX, y: point.clientY };
  }
  function up(event) {
    if (!start) return;
    const point = event.changedTouches ? event.changedTouches[0] : event;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.hypot(dx, dy) > 18) onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : (dy > 0 ? "ArrowDown" : "ArrowUp"));
    start = null;
  }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointerup", up);
  };
}

function runSnake(canvas, { onScore, onOver }) {
  const cols = 15;
  const rows = 16;
  let alive = true;
  let dir = { x: 1, y: 0 };
  let next = { x: 1, y: 0 };
  let snake = [{ x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }];
  let apple = { x: 10, y: 8 };
  let apples = 0;
  let acc = 0;
  let last = performance.now();
  let frame = 0;
  let view = fitCanvas(canvas);
  const onResize = () => { view = fitCanvas(canvas); };
  window.addEventListener("resize", onResize);
  const keys = (event) => {
    const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const step = map[event.key];
    if (!step || (step[0] === -dir.x && step[1] === -dir.y)) return;
    event.preventDefault();
    next = { x: step[0], y: step[1] };
  };
  const unswipe = pointerSwipe(canvas, (key) => keys({ key, preventDefault() {} }));
  window.addEventListener("keydown", keys);

  function placeApple() {
    const open = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) if (!snake.some((part) => part.x === x && part.y === y)) open.push({ x, y });
    }
    apple = open[Math.floor(Math.random() * open.length)] || apple;
  }

  function tick(now) {
    if (!alive) return;
    const { ctx, width, height } = view;
    const cell = Math.floor(Math.min(width / cols, height / rows));
    const ox = Math.floor((width - cell * cols) / 2);
    const oy = Math.floor((height - cell * rows) / 2);
    acc += now - last;
    last = now;
    const pace = Math.max(90, 170 - apples * 4);
    while (acc >= pace) {
      acc -= pace;
      dir = next;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const hit = head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || snake.some((part) => part.x === head.x && part.y === head.y);
      if (hit) {
        alive = false;
        onOver(apples);
        break;
      }
      snake.unshift(head);
      if (head.x === apple.x && head.y === apple.y) {
        apples += 1;
        onScore(apples);
        placeApple();
      } else snake.pop();
    }
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#163226";
    roundRect(ctx, ox - 6, oy - 6, cell * cols + 12, cell * rows + 12, 18);
    ctx.fill();
    ctx.fillStyle = "#1E4634";
    ctx.fillRect(ox, oy, cell * cols, cell * rows);
    ctx.fillStyle = "#FF5A5A";
    roundRect(ctx, ox + apple.x * cell + 3, oy + apple.y * cell + 3, cell - 6, cell - 6, 8);
    ctx.fill();
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? "#B6F25C" : "#7ED957";
      roundRect(ctx, ox + part.x * cell + 2, oy + part.y * cell + 2, cell - 4, cell - 4, 6);
      ctx.fill();
    });
    if (alive) frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    window.removeEventListener("keydown", keys);
    window.removeEventListener("resize", onResize);
    unswipe();
  };
}

function runCars(canvas, { onScore, onOver }) {
  let alive = true;
  let lane = 1;
  let meters = 0;
  let speed = 220;
  let last = performance.now();
  let spawn = 0;
  let frame = 0;
  let view = fitCanvas(canvas);
  let lastShown = -1;
  const traffic = [];
  const onResize = () => { view = fitCanvas(canvas); };
  const steer = (step) => { lane = Math.max(0, Math.min(2, lane + step)); };
  const keys = (event) => {
    if (event.type !== "keydown" || event.repeat) return;
    if (event.key === "ArrowLeft") steer(-1);
    if (event.key === "ArrowRight") steer(1);
    if (event.key.startsWith("Arrow")) event.preventDefault();
  };
  const unswipe = pointerSwipe(canvas, (key) => { if (key === "ArrowLeft" || key === "ArrowRight") steer(key === "ArrowLeft" ? -1 : 1); });
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", keys);

  function tick(now) {
    if (!alive) return;
    const { ctx, width, height } = view;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    speed = Math.min(520, speed + dt * 8);
    meters += dt * (22 + speed / 50);
    const shown = Math.floor(meters);
    if (shown !== lastShown) {
      lastShown = shown;
      onScore(shown);
    }
    spawn -= speed * dt;
    if (spawn <= 0) {
      traffic.push({ lane: Math.floor(Math.random() * 3), y: -90, color: ["#FF6B00", "#7B4FFF", "#00C2CB", "#FF4FA3"][Math.floor(Math.random() * 4)] });
      spawn = 170 + Math.random() * 90;
    }
    const roadX = width * 0.14;
    const roadW = width * 0.72;
    const laneW = roadW / 3;
    for (const car of traffic) car.y += speed * dt;
    const playerY = height - 108;
    const playerX = roadX + lane * laneW + laneW / 2;
    const crashed = traffic.some((car) => car.lane === lane && car.y > playerY - 78 && car.y < playerY + 36);
    ctx.fillStyle = "#16301F";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#3A3A46";
    roundRect(ctx, roadX, 0, roadW, height, 0);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.setLineDash([18, 16]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    const offset = (now / 4) % 34;
    for (const line of [1, 2]) {
      ctx.moveTo(roadX + laneW * line, -offset);
      ctx.lineTo(roadX + laneW * line, height);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const car of traffic) {
      if (car.y > height + 40) continue;
      drawCar(ctx, roadX + car.lane * laneW + laneW / 2, car.y, laneW * 0.62, car.color);
    }
    drawCar(ctx, playerX, playerY, laneW * 0.7, "#FFD54A");
    if (crashed) {
      alive = false;
      onOver(Math.floor(meters));
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    window.removeEventListener("keydown", keys);
    window.removeEventListener("resize", onResize);
    unswipe();
  };
}

function drawCar(ctx, x, y, w, color) {
  const h = w * 1.7;
  ctx.fillStyle = color;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  roundRect(ctx, x - w / 4, y - h / 5, w / 2, h / 3.2, 4);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
