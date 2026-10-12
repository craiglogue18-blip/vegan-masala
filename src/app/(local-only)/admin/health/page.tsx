import Link from "next/link";

import { buildRecipeAppHealth } from "@/lib/recipeAppHealth";
import { getAllGuides } from "@/lib/guides";
import { getAllRecipes } from "@/lib/recipes";
import { isRecipeReadyForIndex } from "@/lib/recipeQuality";
import { allQueueItems } from "@/lib/social/core/queue";
import { getMetaConfig, validateMetaConfig } from "@/lib/social/publishers/metaCore";
import { tikTokPublishingConfigured } from "@/lib/social/publishers/publishTikTok";
import { youtubePublishingConfigured } from "@/lib/social/publishers/publishYouTube";

export const dynamic = "force-dynamic";

function Card({ label, value, note, tone = "text-[var(--brand-gold)]" }: { label: string; value: string | number; note: string; tone?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{label}</p><p className={`mt-3 text-4xl font-extrabold ${tone}`}>{value}</p><p className="mt-2 text-xs leading-5 text-white/40">{note}</p></div>;
}

export default async function SiteHealthOverviewPage() {
  const recipes = getAllRecipes();
  const guides = getAllGuides();
  const recipeHealth = buildRecipeAppHealth(recipes);
  const queue = await allQueueItems().catch(() => []);
  const [youtube, tiktok] = await Promise.all([
    youtubePublishingConfigured().catch(() => false),
    tikTokPublishingConfigured().catch(() => false),
  ]);
  const blockers = recipeHealth.reduce((sum, item) => sum + item.issues.filter((issue) => issue.severity === "blocker").length, 0);
  const warnings = recipeHealth.reduce((sum, item) => sum + item.issues.filter((issue) => issue.severity === "warning").length, 0);
  const recipesWithVideo = recipeHealth.filter((item) => item.videoCount > 0).length;
  const indexable = recipes.filter(isRecipeReadyForIndex).length;
  const failed = queue.filter((item) => item.status === "failed").length;
  const awaitingApproval = queue.filter((item) => item.status === "queued" && item.requiresApproval).length;
  const metaConfig = getMetaConfig();
  const metaConfigured = validateMetaConfig("instagram", metaConfig).ok && validateMetaConfig("facebook", metaConfig).ok;
  const pinterestConfigured = Boolean(process.env.PINTEREST_REFRESH_TOKEN?.trim() || process.env.PINTEREST_ACCESS_TOKEN?.trim() || process.env.PINTEREST_TOKEN?.trim());
  const connectedCount = [metaConfigured, pinterestConfigured, youtube, tiktok].filter(Boolean).length;

  const priorities = [
    failed ? { href: "/admin/social/health", label: `Resolve ${failed} publishing failure${failed === 1 ? "" : "s"}`, note: "Publishing" } : null,
    blockers ? { href: "/admin/app/health", label: `Repair ${blockers} recipe blocker${blockers === 1 ? "" : "s"}`, note: "Recipes" } : null,
    indexable < recipes.length ? { href: "/admin/seo/health", label: `Review ${recipes.length - indexable} recipes excluded from indexing`, note: "SEO" } : null,
    awaitingApproval ? { href: "/admin/social/queue", label: `Approve or hold ${awaitingApproval} queued draft${awaitingApproval === 1 ? "" : "s"}`, note: "Publishing" } : null,
  ].filter(Boolean) as Array<{ href: string; label: string; note: string }>;

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <section className="rounded-3xl border border-[var(--brand-gold)]/25 bg-gradient-to-br from-[#172129] to-[#0b1217] p-7 sm:p-9">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]/65">Quality control</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)]">Site health overview</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[var(--text-soft)]">One triage view for publishing reliability, search readiness and recipe data. Open the specialist tabs above only when a category needs work.</p>
    </section>

    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Card label="Publishing failures" value={failed} note={`${awaitingApproval} drafts are waiting for review`} tone={failed ? "text-red-300" : "text-emerald-300"} />
      <Card label="Connected publishers" value={`${connectedCount}/4`} note="Meta, Pinterest, YouTube and TikTok configuration" tone={connectedCount === 4 ? "text-emerald-300" : "text-amber-300"} />
      <Card label="Search-ready recipes" value={`${indexable}/${recipes.length}`} note={`${guides.length} guides are also included in the content library`} />
      <Card label="Recipe data issues" value={blockers} note={`${warnings} additional warnings should be reviewed`} tone={blockers ? "text-red-300" : warnings ? "text-amber-300" : "text-emerald-300"} />
      <Card label="Video coverage" value={`${recipesWithVideo}/${recipes.length}`} note="Recipes with at least one approved step video" tone={recipesWithVideo ? "text-sky-300" : "text-amber-300"} />
    </section>

    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <h2 className="text-xl font-extrabold text-white">Recommended order</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {priorities.length ? priorities.map((item, index) => <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/15 p-4 transition hover:border-[var(--brand-gold)]/30 hover:bg-[var(--brand-gold)]/[0.05]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand-gold)] font-extrabold text-black">{index + 1}</span><span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wider text-[var(--brand-gold)]/65">{item.note}</span><span className="mt-1 block font-bold text-white/80 group-hover:text-white">{item.label}</span></span></Link>) : <p className="col-span-full rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 text-emerald-200">No urgent publishing, indexing or recipe-data problems were detected.</p>}
      </div>
    </section>
  </main>;
}
