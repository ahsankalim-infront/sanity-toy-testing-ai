"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function PhoneField({ countries, countryCode, phone, onCountry, onPhone }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef(null);
  const country = countries.find((row) => row.code === countryCode) || countries[0];
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((row) => !q || row.name.toLowerCase().includes(q) || row.dial.includes(q) || row.code.toLowerCase().includes(q));
  }, [countries, query]);

  useEffect(() => {
    const close = (event) => {
      if (root.current && !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function type(value) {
    let digits = value.replace(/\D/g, "");
    const dial = String(country?.dial || "").replace(/\D/g, "");
    if (dial && digits.startsWith(dial)) digits = digits.slice(dial.length);
    digits = digits.replace(/^0+/, "");
    onPhone(digits.slice(0, Number(country?.digits) || 15));
  }

  return (
    <div className="field" ref={root}>
      <label htmlFor="phone">Mobile number</label>
      <div className={`phone-modern ${open ? "open" : ""}`}>
        <button type="button" className="dial-btn" aria-expanded={open} onClick={() => { setOpen((value) => !value); setQuery(""); }}>
          <span className="dial-flag">{country?.flag}</span>
          <span>{country?.dial}</span>
          <span className="dial-caret">▾</span>
        </button>
        <input
          id="phone"
          required
          inputMode="numeric"
          autoComplete="tel-national"
          value={groupPhone(phone, country)}
          placeholder={country?.example || "Mobile number"}
          onChange={(event) => type(event.target.value)}
        />
        {open ? (
          <div className="place-menu">
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country" aria-label="Search country" />
            <ul>
              {matches.map((row) => (
                <li key={row.code}>
                  <button type="button" className={row.code === country?.code ? "on" : ""} onClick={() => { onCountry(row.code); onPhone(""); setOpen(false); }}>
                    <span>{row.flag} {row.name}</span>
                    <b>{row.dial}</b>
                  </button>
                </li>
              ))}
              {!matches.length ? <li className="place-empty">No country matches</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
      <small className="field-hint">{country ? `${country.name} · ${country.digits} digits` : "Choose a country"}</small>
    </div>
  );
}

export function CityField({ cities, countryCode, city, onCity }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const list = cities.filter((row) => row.country_code === countryCode);
  const q = city.trim().toLowerCase();
  const matches = list.filter((row) => !q || row.name.toLowerCase().includes(q)).slice(0, 8);
  const exact = list.some((row) => row.name.toLowerCase() === q);

  useEffect(() => {
    const close = (event) => {
      if (root.current && !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="field" ref={root}>
      <label htmlFor="city">City</label>
      <div className={`city-modern ${open ? "open" : ""}`}>
        <input
          id="city"
          required
          autoComplete="address-level2"
          value={city}
          placeholder={list.length ? "Search your city" : "Enter your city"}
          onFocus={() => setOpen(true)}
          onChange={(event) => { onCity(event.target.value); setOpen(true); }}
        />
        {open && (matches.length || (city.trim() && !exact)) ? (
          <div className="place-menu">
            <ul>
              {matches.map((row) => (
                <li key={row.id}>
                  <button type="button" className={row.name === city ? "on" : ""} onClick={() => { onCity(row.name); setOpen(false); }}>
                    <span>{row.name}</span>
                  </button>
                </li>
              ))}
              {city.trim() && !exact ? (
                <li>
                  <button type="button" onClick={() => setOpen(false)}>Use “{city.trim()}”</button>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function groupPhone(value, country) {
  const digits = String(value || "");
  if (!digits) return "";
  if (country?.code === "PK") return digits.replace(/(\d{3})(\d{0,7})/, (_, a, b) => (b ? `${a} ${b}` : a));
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}
