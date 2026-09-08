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

function path(points: Point[], key: (typeof SERIES)[number]["key"]) {
  const values = points.map((point) => point[key]);
  const max = Math.max(1, ...values);
  return values.map((value, index) => {
    const x = points.length === 1 ? 50 : 4 + (index / (points.length - 1)) * 92;
    const y = 88 - (value / max) * 72;
    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

export function GrowthPulseChart({ points }: { points: Point[] }) {
  const totals = SERIES.map((series) => ({
    ...series,
    total: points.reduce((sum, point) => sum + point[series.key], 0),
  }));

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/25 bg-gradient-to-br from-[#172129] to-[#091015] p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/65">Everything at a glance</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">28-day growth pulse</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Each line is scaled to its own peak, making direction and momentum comparable while the totals below retain the real figures.</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-black/20 p-3">
        <svg viewBox="0 0 100 100" className="h-[330px] min-w-[760px] w-full" role="img" aria-label="Daily Google discovery, Google visits, website actions, social reach and published posts over 28 days">
          {[16, 34, 52, 70, 88].map((y) => <line key={y} x1="4" x2="96" y1={y} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth=".35" />)}
          {SERIES.map((series) => (
            <path key={series.key} d={path(points, series.key)} fill="none" stroke={series.colour} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {totals.map((series) => (
          <div key={series.key} className="rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-soft)]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.colour }} />{series.label}</div>
            <p className="mt-2 text-2xl font-extrabold text-white">{new Intl.NumberFormat("en-GB").format(series.total)}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]/70">Social reach currently combines connected Pinterest impressions and YouTube views. Facebook, Instagram and TikTok audience totals remain in their account cards until those APIs provide daily analytics permission.</p>
    </section>
  );
}
