"use client";

import { useState } from "react";

const COLORS = ["#FF6B00", "#00B8C8", "#E8006E", "#8B5CF6", "#5DC800", "#3B6FE8", "#FFB800", "#FF2D2D"];

export function compact(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  return String(Math.round(amount));
}

export function TrendChart({ data, height = 240 }) {
  const [hover, setHover] = useState(null);
  const width = 760;
  const pad = { top: 16, right: 44, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxRevenue = Math.max(1, ...data.map((row) => row.revenue));
  const maxOrders = Math.max(1, ...data.map((row) => row.orders));
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const x = (index) => pad.left + index * step;
  const yRev = (value) => pad.top + innerH - (value / maxRevenue) * innerH;
  const barW = Math.max(2, Math.min(18, step * 0.55));
  const line = data.map((row, index) => `${index ? "L" : "M"}${x(index)},${yRev(row.revenue)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const active = hover === null ? null : data[hover];

  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity=".35" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH * (1 - tick)} y2={pad.top + innerH * (1 - tick)} stroke="#F0EDE8" />
            <text x={pad.left - 8} y={pad.top + innerH * (1 - tick) + 4} textAnchor="end" className="chart-axis">{compact(maxRevenue * tick)}</text>
            <text x={width - pad.right + 8} y={pad.top + innerH * (1 - tick) + 4} className="chart-axis">{Math.round(maxOrders * tick)}</text>
          </g>
        ))}
        {data.map((row, index) => (
          <rect key={row.date} x={x(index) - barW / 2} y={pad.top + innerH - (row.orders / maxOrders) * innerH} width={barW} height={(row.orders / maxOrders) * innerH} rx="3" fill="#00B8C8" opacity={hover === index ? 0.6 : 0.25} />
        ))}
        <path d={area} fill="url(#revFill)" />
        <path d={line} fill="none" stroke="#FF6B00" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((row, index) => (index % labelEvery === 0 || index === data.length - 1 ? (
          <text key={`l-${row.date}`} x={x(index)} y={height - 8} textAnchor="middle" className="chart-axis">{row.date.slice(5)}</text>
        ) : null))}
        {active ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#1A1A2E" strokeDasharray="4 4" opacity=".3" />
            <circle cx={x(hover)} cy={yRev(active.revenue)} r="6" fill="#FF6B00" stroke="white" strokeWidth="3" />
          </g>
        ) : null}
        {data.map((row, index) => (
          <rect key={`h-${row.date}`} x={x(index) - step / 2} y={pad.top} width={Math.max(step, 4)} height={innerH} fill="transparent" onMouseEnter={() => setHover(index)} onTouchStart={() => setHover(index)} />
        ))}
      </svg>
      <div className="chart-legend">
        <span><i style={{ background: "#FF6B00" }} /> Revenue (PKR, left)</span>
        <span><i style={{ background: "#00B8C8" }} /> Orders (right)</span>
        {active ? <b>{active.date}: PKR {Number(active.revenue).toLocaleString("en-PK")} · {active.orders} orders</b> : <span className="muted">Hover a day for details</span>}
      </div>
    </div>
  );
}

export function Donut({ data, money = false, size = 170 }) {
  const total = data.reduce((sum, row) => sum + row.value, 0) || 1;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 170 170" width={size} height={size}>
        <circle cx="85" cy="85" r={radius} fill="none" stroke="#F3F0EA" strokeWidth="22" />
        {data.map((row, index) => {
          const length = (row.value / total) * circumference;
          const segment = (
            <circle key={row.label} cx="85" cy="85" r={radius} fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="22" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 85 85)" />
          );
          offset += length;
          return segment;
        })}
        <text x="85" y="82" textAnchor="middle" className="donut-total">{money ? compact(total) : total}</text>
        <text x="85" y="102" textAnchor="middle" className="chart-axis">{money ? "PKR" : "orders"}</text>
      </svg>
      <ul className="legend-list">
        {data.map((row, index) => (
          <li key={row.label}>
            <i style={{ background: COLORS[index % COLORS.length] }} />
            <span>{row.label}</span>
            <b>{money ? compact(row.value) : row.value} <small>{Math.round((row.value / total) * 100)}%</small></b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({ data, money = true, color = "#FF6B00" }) {
  const max = Math.max(1, ...data.map((row) => row.value));
  if (!data.length) return <p className="muted">No sales in this period.</p>;
  return (
    <ul className="bar-list">
      {data.map((row) => (
        <li key={row.label}>
          <div className="bar-head"><span>{row.label}</span><b>{money ? `PKR ${Number(row.value).toLocaleString("en-PK")}` : row.value}</b></div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(row.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}
