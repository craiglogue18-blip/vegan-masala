import Link from "next/link";
import { getGrowthDashboard } from "@/lib/growth-dashboard";

export const dynamic = "force-dynamic";

function number(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function delta(current: number, previous: number) {
  if (!previous) return current ? "New activity" : "No change";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs previous 28 days`;
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand-gold)]/20 bg-[var(--surface)] p-5 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]/65">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{note}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[var(--border)] bg-black/10 p-4 text-sm text-[var(--text-soft)]">{children}</p>;
}

export default async function GrowthDashboardPage() {
  const data = await getGrowthDashboard();
  const search = data.search.ok ? data.search.data : null;
  const affiliateClicks = data.current.affiliateClicks + data.current.commerceClicks;
  const previousAffiliateClicks = data.previous.affiliateClicks + data.previous.commerceClicks;
  const signupRate = data.current.planViews
    ? data.current.planConfirmed / data.current.planViews
    : 0;

  const priorities: string[] = [];
  if (!search) priorities.push("Connect or repair Search Console credentials to unlock search reporting.");
  if (search && search.summary.current.impressions > 0 && search.summary.current.ctr < 0.02) {
    priorities.push("Search visibility is growing, but the click-through rate is below 2%. Improve titles and descriptions on high-impression pages.");
  }
  if (!affiliateClicks) priorities.push("No affiliate clicks were recorded in this window. Promote an equipment guide or a high-intent recipe page.");
  if (data.current.planViews && !data.current.planConfirmed) priorities.push("The dinner plan is receiving visits without confirmed sign-ups. Review the form and confirmation journey.");
  if (data.social.failed) priorities.push(`${data.social.failed} social queue item${data.social.failed === 1 ? " has" : "s have"} failed and should be reviewed.`);
  if (!priorities.length) priorities.push("No urgent tracking problems detected. Keep publishing consistently and review the leading pages and products below.");

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
      <header className="rounded-3xl border border-[var(--brand-gold)]/25 bg-gradient-to-br from-[#172129] to-[#0b1217] p-7 sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]/65">Private admin</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">Growth dashboard</h1>
            <p className="mt-3 max-w-3xl leading-7 text-[var(--text-soft)]">One view of search discovery, visitor actions, affiliate interest and social publishing. Engagement figures cover the latest 28 days.</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/admin/social" className="rounded-xl border border-[var(--border)] px-4 py-2 text-[var(--brand-gold)] hover:bg-white/5">Social admin</Link>
            <Link href="/admin/seo/health" className="rounded-xl border border-[var(--border)] px-4 py-2 text-[var(--brand-gold)] hover:bg-white/5">SEO health</Link>
          </nav>
        </div>
        <p className="mt-5 text-xs text-[var(--text-soft)]/70">Updated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">At a glance</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Google clicks" value={search ? number(search.summary.current.clicks) : "—"} note={search ? delta(search.summary.current.clicks, search.summary.previous.clicks) : "Search Console data unavailable"} />
          <Metric label="Search impressions" value={search ? number(search.summary.current.impressions) : "—"} note={search ? `${percent(search.summary.current.ctr)} click-through rate` : "Search Console data unavailable"} />
          <Metric label="Affiliate clicks" value={number(affiliateClicks)} note={data.engagementConnected ? delta(affiliateClicks, previousAffiliateClicks) : "Engagement storage not connected"} />
          <Metric label="Confirmed dinner plans" value={number(data.current.planConfirmed)} note={`${percent(signupRate)} of dinner-plan visits`} />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">What needs attention?</h2>
          <div className="mt-4 space-y-3">
            {priorities.map((priority, index) => (
              <div key={priority} className="flex gap-3 rounded-xl bg-black/15 p-4 text-sm leading-6 text-[var(--text-soft)]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold)] text-xs font-extrabold text-[#111820]">{index + 1}</span>
                <p>{priority}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Dinner-plan journey</h2>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["Page views", data.current.planViews],
              ["Form starts", data.current.planStarts],
              ["Forms submitted", data.current.planSubmits],
              ["Confirmed", data.current.planConfirmed],
              ["Downloads", data.current.planDownloads],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-soft)]">{label}</span>
                <strong className="text-[var(--brand-gold)]">{number(Number(value))}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Top search pages</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Pages bringing visitors from Google during the latest reporting window.</p>
          <div className="mt-5 space-y-3">
            {search?.topPages.length ? search.topPages.map((page) => (
              <div key={page.page} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl bg-black/15 p-4">
                <p className="truncate text-sm font-bold text-[var(--text)]">{page.page.replace(/^https?:\/\/[^/]+/, "") || "/"}</p>
                <p className="text-sm text-[var(--brand-gold)]">{number(page.clicks)} clicks</p>
                <p className="text-xs text-[var(--text-soft)]">{number(page.impressions)} impressions</p>
                <p className="text-right text-xs text-[var(--text-soft)]">Position {page.position.toFixed(1)}</p>
              </div>
            )) : <Empty>No Search Console page data is available yet.</Empty>}
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Searches finding Vegan Masala</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Use these phrases to guide the next recipes, guides and social posts.</p>
          <div className="mt-5 space-y-3">
            {search?.topQueries.length ? search.topQueries.map((query) => (
              <div key={query.query} className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 text-sm">
                <span className="font-bold text-[var(--text)]">{query.query}</span>
                <span className="shrink-0 text-[var(--text-soft)]">{number(query.impressions)} impressions · {number(query.clicks)} clicks</span>
              </div>
            )) : <Empty>No Search Console query data is available yet.</Empty>}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Affiliate interest</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Most-clicked products across affiliate partners.</p>
          <div className="mt-5 space-y-3">
            {data.topAffiliateProducts.length ? data.topAffiliateProducts.map((item) => (
              <div key={item.label} className="flex justify-between gap-4 text-sm"><span className="text-[var(--text-soft)]">{titleCase(item.label)}</span><strong className="text-[var(--brand-gold)]">{item.count}</strong></div>
            )) : <Empty>No affiliate clicks recorded in this window.</Empty>}
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Popular recipes this week</h2>
          <div className="mt-5 space-y-3">
            {data.trending.length ? data.trending.map((item) => (
              <Link key={item.slug} href={`/recipes/${item.slug}`} className="flex justify-between gap-4 text-sm hover:underline"><span className="text-[var(--text-soft)]">{titleCase(item.slug)}</span><strong className="text-[var(--brand-gold)]">{item.views}</strong></Link>
            )) : <Empty>No recipe-view totals are available yet.</Empty>}
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Social publishing</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Metric label="Posted" value={data.social.posted} note="All time" />
            <Metric label="Queued" value={data.social.queued} note="Upcoming" />
            <Metric label="Failed" value={data.social.failed} note="Review" />
          </div>
          <div className="mt-5 space-y-2 text-xs text-[var(--text-soft)]">
            {data.social.platforms.map((item) => <p key={item.platform} className="flex justify-between"><span>{titleCase(item.platform)}</span><span>{item.posted} posted · {item.queued} queued · {item.failed} failed</span></p>)}
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-[var(--brand-gold)]/20 bg-[var(--surface)] p-6">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Services and usage</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Connection checks never display secret keys. Recraft&apos;s balance is read directly without consuming generation credits.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-black/15 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]/65">Recraft API</p>
            <p className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">{data.services.recraft.credits === null ? "—" : number(data.services.recraft.credits)}</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">{data.services.recraft.credits === null ? data.services.recraft.error || "Token not configured" : "API units remaining"}</p>
          </div>
          <div className="rounded-xl bg-black/15 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]/65">OpenAI API</p>
            <p className="mt-2 text-lg font-extrabold text-[var(--text)]">{data.services.openAi.configured ? "Connected" : "Not connected"}</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">{data.services.openAi.usageConnected ? "Admin usage reporting available" : "Usage requires a separate Admin API key"}</p>
          </div>
          <div className="rounded-xl bg-black/15 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]/65">Traffic data</p>
            <p className="mt-2 text-lg font-extrabold text-[var(--text)]">{data.services.searchConsole.configured ? "Search Console connected" : "Search Console not connected"}</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">{data.engagementConnected ? "On-site engagement connected" : "On-site engagement not connected"}</p>
          </div>
          <div className="rounded-xl bg-black/15 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]/65">Social APIs</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--text)]">Meta {data.services.meta.configured ? "✓" : "—"} · Pinterest {data.services.pinterest.configured ? "✓" : "—"}</p>
            <p className="text-sm font-bold leading-6 text-[var(--text)]">YouTube {data.services.youtube.configured ? "✓" : "—"} · TikTok {data.services.tiktok.configured ? "✓" : "—"}</p>
          </div>
        </div>

        <h3 className="mt-7 text-lg font-extrabold text-[var(--brand-gold)]">Reporting connections still needed</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-black/15 p-4"><p className="font-bold text-[var(--text)]">Kit subscribers</p><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Not connected yet. Add Kit reporting credentials later to show subscriber totals, growth and form conversion.</p></div>
          <div className="rounded-xl bg-black/15 p-4"><p className="font-bold text-[var(--text)]">Amazon and Awin sales</p><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Click tracking is active. Confirmed orders and commission require reporting access or periodic imports from the partner dashboards.</p></div>
        </div>
      </section>
    </main>
  );
}
