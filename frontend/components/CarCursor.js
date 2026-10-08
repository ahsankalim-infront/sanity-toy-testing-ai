"use client";

import { useEffect, useRef, useState } from "react";

const HOVER = "a,button,select,label,summary,[role=button],.pcard,.cat-card,.age-step,.stem-card,.blog-card,.rv-item,.drop-item,.app-store-btn,.soc-btn";
const TEXT = "input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea,[contenteditable=true]";

export default function CarCursor() {
  const car = useRef(null);
  const dot = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(query.matches && !reduce.matches);
    sync();
    query.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    root.classList.add("car-cursor");
    let x = -100;
    let y = -100;
    let prevX = -100;
    let frame = 0;
    let state = { flip: false, hover: false, down: false, text: false, hidden: true };

    const paint = () => {
      frame = 0;
      const scale = state.down ? 0.85 : state.hover ? 1.25 : 1;
      const tilt = state.hover ? -8 : state.flip !== null ? -5 : 0;
      if (car.current) {
        car.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scaleX(${state.flip ? -1 : 1}) scale(${scale}) rotate(${tilt}deg)`;
        car.current.style.opacity = state.hidden || state.text ? "0" : "1";
      }
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${state.hover ? 1.75 : 1})`;
        dot.current.style.background = state.hover ? "#FFD700" : "#FF6B00";
        dot.current.style.opacity = state.hidden || state.text ? "0" : "0.6";
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };

    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      const dx = x - prevX;
      prevX = x;
      if (dx > 3) state.flip = false;
      else if (dx < -3) state.flip = true;
      const target = event.target instanceof Element ? event.target : null;
      state.text = Boolean(target?.closest(TEXT));
      state.hover = !state.text && Boolean(target?.closest(HOVER));
      state.hidden = false;
      schedule();
    };
    const down = () => { state.down = true; schedule(); };
    const up = () => { state.down = false; schedule(); };
    const leave = () => { state.hidden = true; schedule(); };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("mouseleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      root.classList.remove("car-cursor");
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <svg ref={car} id="cur" viewBox="0 0 80 44" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="4" y="20" width="72" height="18" rx="7" fill="#FF6B00" />
        <path d="M18 20 Q22 9 30 9 L54 9 Q62 9 66 20Z" fill="#E8006E" />
        <path d="M22 20 Q25 12 31 12 L52 12 Q58 12 62 20Z" fill="#A8E6FF" opacity=".85" />
        <rect x="24" y="12" width="12" height="8" rx="2" fill="#A8E6FF" opacity=".7" />
        <rect x="38" y="12" width="12" height="8" rx="2" fill="#A8E6FF" opacity=".7" />
        <circle cx="20" cy="38" r="7" fill="#222" />
        <circle cx="20" cy="38" r="3.5" fill="#888" />
        <circle cx="60" cy="38" r="7" fill="#222" />
        <circle cx="60" cy="38" r="3.5" fill="#888" />
        <rect x="74" y="23" width="5" height="7" rx="2.5" fill="#FFD700" />
        <rect x="1" y="23" width="5" height="7" rx="2.5" fill="#FF2D2D" />
        <line x1="40" y1="20" x2="40" y2="38" stroke="#CC5500" strokeWidth="1.2" opacity=".5" />
        <rect x="26" y="28" width="7" height="2.5" rx="1.2" fill="#CC5500" opacity=".6" />
        <rect x="47" y="28" width="7" height="2.5" rx="1.2" fill="#CC5500" opacity=".6" />
      </svg>
      <div ref={dot} id="cur-dot" aria-hidden />
    </>
  );
}
