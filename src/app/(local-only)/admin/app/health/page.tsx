import Link from "next/link";

import { buildRecipeAppHealth, suggestRecipeMealTypes, type AppHealthSeverity } from "@/lib/recipeAppHealth";
import { getAllRecipes } from "@/lib/recipes";

import MealTypeEditor from "./MealTypeEditor";
import ServingEditor from "./ServingEditor";
import HealthSearch from "./HealthSearch";
import RecipeDataEditor from "./RecipeDataEditor";

export const dynamic = "force-dynamic";

const severityStyle: Record<AppHealthSeverity, string> = {
  blocker: "border-red-800/70 bg-red-950/35 text-red-200",
  warning: "border-amber-700/70 bg-amber-950/30 text-amber-100",
  improvement: "border-sky-800/70 bg-sky-950/25 text-sky-100",
};

function plural(value: number, word: string) {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

export default function AppRecipeHealthPage() {
  const report = buildRecipeAppHealth(getAllRecipes());
  const issueCount = (severity: AppHealthSeverity) => report.reduce((total, item) => total + item.issues.filter((problem) => problem.severity === severity).length, 0);
  const classified = report.filter((item) => item.recipe.mealTypes?.length).length;
  const shoppingReady = report.filter((item) => !item.issues.some((problem) => problem.severity === "blocker" && problem.area === "Shopping")).length;
  const cookingReady = report.filter((item) => !item.issues.some((problem) => problem.severity === "blocker" && problem.area === "Cooking")).length;
  const videos = report.reduce((total, item) => total + item.videoCount, 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">Admin · App quality</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)]">Recipe app health</h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">A read-only check of the recipe information used by meal planning, weekly shopping and step-by-step cooking. Fix blockers first; video coverage is deliberately treated as an optional improvement.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/social" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-gold)]">Admin home</Link>
          <Link href="/meal-planner" className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white">Open the app</Link>
        </div>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Recipe catalogue", report.length, `${issueCount("blocker")} blockers to resolve`],
          ["Meal classified", classified, `${report.length - classified} still use guessing`],
          ["Shopping ready", shoppingReady, `${report.length - shoppingReady} cannot scale reliably`],
          ["Cooking ready", cookingReady, `${videos} approved step videos`],
        ].map(([label, value, note]) => <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">{label}</p><p className="mt-2 text-4xl font-extrabold text-[var(--brand-gold)]">{value}</p><p className="mt-2 text-sm text-[var(--text-soft)]">{note}</p></div>)}
      </section>

      <section className="mt-7 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-2xl font-extrabold text-[var(--brand-gold)]">Recommended order</h2>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-[var(--text-soft)] md:grid-cols-3">
          <li className="rounded-2xl border border-red-900/60 bg-red-950/20 p-4"><strong className="block text-red-200">1. Fix {plural(issueCount("blocker"), "blocker")}</strong>Meal type, servings, ingredients and cooking steps affect core functionality.</li>
          <li className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4"><strong className="block text-amber-100">2. Review {plural(issueCount("warning"), "warning")}</strong>These recipes work, but clearer quantities and metadata will improve results.</li>
          <li className="rounded-2xl border border-sky-900/60 bg-sky-950/20 p-4"><strong className="block text-sky-100">3. Add enhancements gradually</strong>{plural(issueCount("improvement"), "improvement")}, including optional cooking videos.</li>
        </ol>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">Full catalogue</p><h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">Recipes needing the most attention first</h2></div><p className="text-sm text-[var(--text-soft)]">Open a row to see its checks</p></div>
        <HealthSearch />
        <div className="mt-5 space-y-3">
          {report.map((item) => {
            const blockers = item.issues.filter((problem) => problem.severity === "blocker").length;
            const warnings = item.issues.filter((problem) => problem.severity === "warning").length;
            return <details key={item.recipe.slug} data-health-recipe={`${item.recipe.title} ${item.recipe.slug} ${item.issues.map((problem) => `${problem.area} ${problem.message}`).join(" ")}`.toLowerCase()} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] open:bg-black/20">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 sm:p-5">
                <span className={`h-3 w-3 shrink-0 rounded-full ${blockers ? "bg-red-500" : warnings ? "bg-amber-400" : "bg-green-400"}`} />
                <span className="min-w-56 flex-1 font-extrabold text-white">{item.recipe.title}</span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--text-soft)]">{item.score}%</span>
                <span className="min-w-28 text-right text-xs font-bold text-[var(--text-soft)]">{blockers ? plural(blockers, "blocker") : item.status}</span>
              </summary>
              <div className="border-t border-[var(--border)] px-4 pb-5 pt-4 sm:px-5">
                <div className="grid gap-2">
                  {item.issues.length ? item.issues.map((problem, index) => <div key={`${problem.area}-${index}`} className={`rounded-xl border px-4 py-3 text-sm ${severityStyle[problem.severity]}`}><span className="mr-2 font-extrabold">{problem.area}</span>{problem.message}</div>) : <p className="rounded-xl border border-green-800/70 bg-green-950/30 px-4 py-3 text-sm text-green-200">No app-readiness issues detected.</p>}
                </div>
                <MealTypeEditor slug={item.recipe.slug} current={item.recipe.mealTypes ?? []} suggested={suggestRecipeMealTypes(item.recipe)} />
                <ServingEditor slug={item.recipe.slug} current={item.recipe.servings ?? item.recipe.serves} />
                <RecipeDataEditor slug={item.recipe.slug} initialTags={item.recipe.plannerTags ?? []} initialIngredients={item.ingredients} steps={item.steps} initialVideos={item.recipe.stepVideos ?? []} />
                <div className="mt-4 flex flex-wrap gap-3 text-sm"><Link href={`/recipes/${item.recipe.slug}`} className="font-bold text-[var(--brand-gold)] underline underline-offset-4">View recipe</Link><Link href={`/meal-planner/cook/${item.recipe.slug}`} className="font-bold text-[var(--brand-gold)] underline underline-offset-4">Test cooking mode</Link><span className="text-[var(--text-soft)]">{plural(item.ingredients.length, "ingredient")} · {plural(item.steps.length, "step")} · {plural(item.videoCount, "video")}</span></div>
              </div>
            </details>;
          })}
        </div>
      </section>
    </main>
  );
}
