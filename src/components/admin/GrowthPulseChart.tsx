"use client";

import { useState } from "react";

type Point = {
  date: string;
  searchImpressions: number;
  searchClicks: number;
  siteActions: number;
  socialReach: number;
  published: number;
};

const SERIES = [
  { key: "searchImpressions", label: "Google discovery", colour: "#d6b25e" },
  { key: "searchClicks", label: "Google visits", colour: "#58c4f1" },
  { key: "siteActions", label: "Website actions", colour: "#71d49b" },
  { key: "socialReach", label: "Social reach & views", colour: "#ec7aa8" },
  { key: "published", label: "Posts published", colour: "#f28b54" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const WIDTH = 1200;
const HEIGHT = 420;
const LEFT = 92;
const RIGHT = 26;
const TOP = 24;
const BOTTOM = 66;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

function path(points: Point[], key: SeriesKey) {
  const values = points.map((point) => point[key]);
  const max = Math.max(1, ...values);
  return values.map((value, index) => {
    const x = points.length === 1 ? LEFT + PLOT_WIDTH / 2 : LEFT + (index / (points.length - 1)) * PLOT_WIDTH;
    const y = TOP + PLOT_HEIGHT - (value / max) * PLOT_HEIGHT;
    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(`${value}T12:00:00Z`)
  );
}

export function GrowthPulseChart({ points }: { points: Point[] }) {
  const [visible, setVisible] = useState<Set<SeriesKey>>(
    () => new Set(SERIES.map((series) => series.key))
  );
  const totals = SERIES.map((series) => ({
    ...series,
    total: points.reduce((sum, point) => sum + point[series.key], 0),
  }));
  const dateTickIndexes = [...new Set([0, 6, 13, 20, points.length - 1])].filter(
    (index) => index >= 0 && index < points.length
  );

  function toggle(key: SeriesKey) {
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="relative left-1/2 mt-8 w-[min(1600px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/25 bg-gradient-to-br from-[#172129] to-[#091015] p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/65">Everything at a glance</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">28-day growth pulse</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Each line is scaled to its own peak, making direction and momentum comparable while the totals below retain the real figures.</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-black/20 p-2 sm:p-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[390px] min-w-[980px] w-full" role="img" aria-label="Daily Google discovery, Google visits, website actions, social reach and published posts over 28 days">
          {[0, 25, 50, 75, 100].map((value) => {
            const y = TOP + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
            return <g key={value}><line x1={LEFT} x2={LEFT + PLOT_WIDTH} y1={y} y2={y} stroke="rgba(255,255,255,.09)" strokeWidth="1" /><text x={LEFT - 16} y={y + 5} textAnchor="end" fill="rgba(255,255,255,.58)" fontSize="13">{value}%</text></g>;
          })}
          <line x1={LEFT} x2={LEFT} y1={TOP} y2={TOP + PLOT_HEIGHT} stroke="rgba(255,255,255,.28)" />
          <line x1={LEFT} x2={LEFT + PLOT_WIDTH} y1={TOP + PLOT_HEIGHT} y2={TOP + PLOT_HEIGHT} stroke="rgba(255,255,255,.28)" />
          {dateTickIndexes.map((index) => {
            const x = LEFT + (index / Math.max(1, points.length - 1)) * PLOT_WIDTH;
            return <g key={index}><line x1={x} x2={x} y1={TOP + PLOT_HEIGHT} y2={TOP + PLOT_HEIGHT + 7} stroke="rgba(255,255,255,.3)" /><text x={x} y={TOP + PLOT_HEIGHT + 25} textAnchor="middle" fill="rgba(255,255,255,.62)" fontSize="13">{dateLabel(points[index].date)}</text></g>;
          })}
          <text x={LEFT + PLOT_WIDTH / 2} y={HEIGHT - 8} textAnchor="middle" fill="rgba(255,255,255,.72)" fontSize="14" fontWeight="700">Date · latest 28 days</text>
          <text transform={`translate(19 ${TOP + PLOT_HEIGHT / 2}) rotate(-90)`} textAnchor="middle" fill="rgba(255,255,255,.72)" fontSize="14" fontWeight="700">Relative daily momentum · % of each line&apos;s peak</text>
          {SERIES.filter((series) => visible.has(series.key)).map((series) => (
            <path key={series.key} d={path(points, series.key)} fill="none" stroke={series.colour} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {totals.map((series) => (
          <button
            key={series.key}
            type="button"
            aria-pressed={visible.has(series.key)}
            onClick={() => toggle(series.key)}
            className={`rounded-xl border p-4 text-left transition ${visible.has(series.key) ? "border-white/15 bg-black/25" : "border-white/5 bg-black/10 opacity-45"}`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-soft)]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.colour }} />{series.label}</div>
            <p className="mt-2 text-2xl font-extrabold text-white">{new Intl.NumberFormat("en-GB").format(series.total)}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">{visible.has(series.key) ? "Line shown · click to hide" : "Line hidden · click to show"}</p>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]/70">Social reach currently combines connected Pinterest impressions and YouTube views. Facebook, Instagram and TikTok audience totals remain in their account cards until those APIs provide daily analytics permission.</p>
    </section>
  );
}
