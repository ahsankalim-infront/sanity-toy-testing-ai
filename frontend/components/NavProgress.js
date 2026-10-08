"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavProgress() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearInterval(timer.current);
    if (!visible) return;
    setWidth(100);
    const hide = setTimeout(() => { setVisible(false); setWidth(0); }, 250);
    return () => clearTimeout(hide);
  }, [pathname, params]);

  useEffect(() => {
    const click = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      clearInterval(timer.current);
      setVisible(true);
      setWidth(12);
      timer.current = setInterval(() => setWidth((value) => (value < 85 ? value + (90 - value) * 0.12 : value)), 120);
    };
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("click", click);
      clearInterval(timer.current);
    };
  }, []);

  return <div className="nav-progress" style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} aria-hidden />;
}
