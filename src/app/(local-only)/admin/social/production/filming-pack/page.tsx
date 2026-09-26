import Link from "next/link";

import { getRecipeBySlug, type Recipe } from "@/lib/recipes";
import {
  buildRecipeFilmingSteps,
  PRIORITY_FILMING_RECIPES,
  sharedShotCategory,
  type FilmingStep,
} from "@/lib/social/video/filmingPack";

import FilmingPackPrintButton from "./FilmingPackPrintButton";

type RecipePack = {
  recipe: Recipe;
  priority: number;
  reason: string;
  preparation: FilmingStep[];
  method: FilmingStep[];
};

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function shotFileName(slug: string, step: FilmingStep) {
  const phase = step.phase === "prep" ? "prep" : "method";
  return `${slug}_${phase}-${String(step.number).padStart(2, "0")}.mp4`;
}

export default function FilmingPackPage() {
  const packs: RecipePack[] = PRIORITY_FILMING_RECIPES.flatMap((priority, index) => {
    const recipe = getRecipeBySlug(priority.slug);
    if (!recipe) return [];
    const { preparation, method } = buildRecipeFilmingSteps(recipe);
    return [{ recipe, priority: index + 1, reason: priority.reason, preparation, method }];
  });

  const sharedGroups = new Map<string, Array<{ recipe: string; caption: string }>>();
  for (const pack of packs) {
    for (const step of [...pack.preparation, ...pack.method]) {
      const category = sharedShotCategory(step.caption);
      if (!category) continue;
      const group = sharedGroups.get(category) || [];
      group.push({ recipe: pack.recipe.title, caption: step.caption });
      sharedGroups.set(category, group);
    }
  }
  const reusableGroups = [...sharedGroups.entries()]
    .map(([title, items]) => ({ title, items, recipes: [...new Set(items.map((item) => item.recipe))] }))
    .filter((group) => group.recipes.length >= 2)
    .sort((left, right) => right.items.length - left.items.length);

  const totalPrep = packs.reduce((total, pack) => total + pack.preparation.length, 0);
  const totalMethod = packs.reduce((total, pack) => total + pack.method.length, 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70 print:text-black">Vegan Masala production</p>
            <h1 className="mt-2 text-4xl font-extrabold text-[var(--brand-gold)] print:text-black">First 10 recipe filming pack</h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)] print:text-black">
              A complete batch-production plan covering ingredient preparation, every published method step, reusable cooking techniques and consistent file naming.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden">
            <Link href="/admin/social/production" className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--brand-gold)]">Back to studio</Link>
            <FilmingPackPrintButton />
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-4">
          {[
            ["Recipes", packs.length],
            ["Preparation shots", totalPrep],
            ["Method shots", totalMethod],
            ["Minimum total clips", packs.length + totalPrep + totalMethod],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-black/10 p-4 print:border-neutral-300 print:bg-white">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)] print:text-neutral-600">{label}</p>
              <p className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)] print:text-black">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 print:break-before-page print:border-neutral-300 print:bg-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70 print:text-black">Before filming</p>
        <h2 className="mt-2 text-2xl font-extrabold text-white print:text-black">Consistent capture guide</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Camera", "Film vertically in 4K or 1080p at 30 fps. Lock the phone on a tripod and clean the lens before every session."],
            ["Light", "Use bright, soft light from the front or side. Keep the first frame clear and well exposed—never begin on black."],
            ["Clips", "Record preparation for 6–10 seconds, active cooking for 10–15 seconds and slow transformations for 20–30 seconds."],
            ["Framing", "Keep hands, utensils and the food inside the central safe area. Leave the lower quarter clear for branded instructions."],
            ["Continuity", "Use the same pan, surface and lighting through one recipe. Capture a clean shot before and after every transformation."],
            ["Audio", "Natural cooking sound is useful even if narration is added later. Avoid radio, television or copyrighted music in the room."],
            ["File names", "Transfer clips without renaming them randomly. Use the exact suggested filename shown beside every shot."],
            ["Safety", "Never compromise safe knife handling or move hot cookware purely for the camera. Reframe the camera instead."],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-black/10 p-5 print:border-neutral-300 print:bg-white">
              <h3 className="font-extrabold text-[var(--brand-gold)] print:text-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)] print:text-black">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 print:break-before-page print:border-neutral-300 print:bg-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70 print:text-black">Batch efficiently</p>
        <h2 className="mt-2 text-2xl font-extrabold text-white print:text-black">Shared shots and techniques</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-soft)] print:text-black">
          These actions recur across several priority recipes. Film clean close-ups during each real recipe session; the grouping helps you keep camera position and lighting consistent, not substitute one recipe’s food for another.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reusableGroups.map((group) => (
            <article key={group.title} className="rounded-2xl border border-[var(--border)] bg-black/10 p-5 print:break-inside-avoid print:border-neutral-300 print:bg-white">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-extrabold text-[var(--brand-gold)] print:text-black">{group.title}</h3>
                <span className="rounded-full bg-[var(--brand-red)] px-2.5 py-1 text-xs font-extrabold text-white">{group.items.length} shots</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-soft)] print:text-black">
                {group.recipes.map((recipe) => <li key={recipe}>□ {recipe}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7 space-y-7">
        {packs.map((pack) => {
          const slug = safeName(pack.recipe.slug);
          return (
            <article key={pack.recipe.slug} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 print:break-before-page print:border-neutral-300 print:bg-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70 print:text-black">Priority {pack.priority}</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-white print:text-black">{pack.recipe.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-soft)] print:text-black">{pack.reason}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                  <span className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--brand-gold)] print:border-neutral-400 print:text-black">{pack.preparation.length} prep</span>
                  <span className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--brand-gold)] print:border-neutral-400 print:text-black">{pack.method.length} method</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/[0.06] p-4 print:border-neutral-400 print:bg-white">
                <p className="text-sm font-extrabold text-[var(--brand-gold)] print:text-black">□ Opening finished dish</p>
                <p className="mt-1 font-mono text-xs text-[var(--text-soft)] print:text-black">{slug}_opening.mp4</p>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--brand-gold)] print:text-black">Ingredient preparation</h3>
                  <ol className="mt-3 space-y-3">
                    {pack.preparation.map((step) => (
                      <li key={step.id} className="rounded-xl border border-[var(--border)] bg-black/10 p-4 print:break-inside-avoid print:border-neutral-300 print:bg-white">
                        <p className="text-sm font-bold text-white print:text-black">□ P{step.number} · {step.caption}</p>
                        <p className="mt-2 font-mono text-[11px] text-[var(--text-soft)] print:text-black">{shotFileName(slug, step)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--brand-gold)] print:text-black">Published cooking method</h3>
                  <ol className="mt-3 space-y-3">
                    {pack.method.map((step) => (
                      <li key={step.id} className="rounded-xl border border-[var(--border)] bg-black/10 p-4 print:break-inside-avoid print:border-neutral-300 print:bg-white">
                        <p className="text-sm font-bold leading-6 text-white print:text-black">□ {step.number} · {step.caption}</p>
                        <p className="mt-2 font-mono text-[11px] text-[var(--text-soft)] print:text-black">{shotFileName(slug, step)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--border)] pt-5 text-sm print:border-neutral-300">
                <span className="font-bold text-[var(--text-soft)] print:text-black">□ Presenter introduction</span>
                <span className="font-bold text-[var(--text-soft)] print:text-black">□ Finished-dish close-up</span>
                <span className="font-bold text-[var(--text-soft)] print:text-black">□ Taste reaction</span>
                <Link href={`/recipes/${pack.recipe.slug}`} className="font-bold text-[var(--brand-gold)] hover:underline print:text-black">Open recipe →</Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
