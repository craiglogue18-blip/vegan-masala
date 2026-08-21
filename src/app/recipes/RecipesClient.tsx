"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type RecipeSummary = {
  title: string;
  slug: string;
  description?: string;
  cuisine?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  diet?: string[];
  tags?: string[];
  publishedAt?: string;

  // ✅ server-resolved image path
  image: string;
  imageIsPlaceholder?: boolean;
};

const PLACEHOLDER = "/brand/image-coming-soon.jpg";

function totalMinutes(prep?: number, cook?: number) {
  const total = (prep ?? 0) + (cook ?? 0);
  return total > 0 ? total : null;
}

function minutesLabel(prep?: number, cook?: number) {
  const total = totalMinutes(prep, cook);
  return total ? `${total} min` : null;
}

function norm(s: string) {
  return s.toLowerCase().trim();
}

export default function RecipesClient({ recipes }: { recipes: RecipeSummary[] }) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "quickest" | "az">("newest");
  const deferredQuery = useDeferredValue(query);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) if (r.cuisine) set.add(r.cuisine);
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [recipes]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) for (const t of r.tags ?? []) set.add(t);
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = norm(deferredQuery);

    let list = recipes.filter((r) => {
      if (cuisine !== "all" && (r.cuisine ?? "") !== cuisine) return false;
      if (tag !== "all" && !(r.tags ?? []).includes(tag)) return false;

      if (!q) return true;

      const hay = [
        r.title,
        r.description ?? "",
        r.cuisine ?? "",
        ...(r.tags ?? []),
        ...(r.diet ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });

    if (sort === "newest") {
      list = [...list].sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
      );
    } else if (sort === "quickest") {
      list = [...list].sort((a, b) => {
        const ta = totalMinutes(a.prepMinutes, a.cookMinutes) ?? 99999;
        const tb = totalMinutes(b.prepMinutes, b.cookMinutes) ?? 99999;
        return ta - tb;
      });
    } else if (sort === "az") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [recipes, deferredQuery, cuisine, tag, sort]);

  const hasFilters = Boolean(query.trim() || cuisine !== "all" || tag !== "all");

  function clearFilters() {
    setQuery("");
    setCuisine("all");
    setTag("all");
    setSort("newest");
  }

  return (
    <>
      {/* FILTER BAR */}
      <section className="z-20 mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-5 shadow-xl backdrop-blur-xl lg:sticky lg:top-20">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
              Find your next meal
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--brand-gold)]">
              Search all recipes
            </h2>
          </div>
          <p aria-live="polite" className="text-sm font-bold text-[var(--text-soft)]">
            {filtered.length} recipe{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_200px_240px_180px] lg:items-end">
          {/* Search */}
          <div>
            <label htmlFor="recipe-search" className="text-xs font-extrabold tracking-wide text-[var(--brand-gold)]">
              Recipe, ingredient or dish
            </label>
            <div className="relative mt-2">
            <input
              id="recipe-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try dal, tofu, potato or biryani…"
              autoComplete="off"
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 py-3 pl-11 pr-12 text-base font-bold text-white outline-none placeholder:text-[var(--text-soft)]/55 focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
            />
            <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--brand-gold)]">⌕</span>
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear recipe search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-lg text-[var(--text-soft)] hover:bg-white/10">×</button>
            ) : null}
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <label className="text-xs font-extrabold tracking-wide text-[var(--brand-gold)]">
              Cuisine
            </label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-black/15 px-4 py-3 text-sm font-bold text-[var(--text-soft)] outline-none focus:border-[var(--brand-gold)]"
            >
              {cuisines.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label className="text-xs font-extrabold tracking-wide text-[var(--brand-gold)]">
              Tag
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-black/15 px-4 py-3 text-sm font-bold text-[var(--text-soft)] outline-none focus:border-[var(--brand-gold)]"
            >
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All" : t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-extrabold tracking-wide text-[var(--brand-gold)]">
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "quickest" | "az")}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-black/15 px-4 py-3 text-sm font-bold text-[var(--text-soft)] outline-none focus:border-[var(--brand-gold)]"
            >
              <option value="newest">Newest</option>
              <option value="quickest">Quickest</option>
              <option value="az">A → Z</option>
            </select>
          </div>
        </div>

        {/* Quick tag chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["all", ...tags.slice(1, 9)].map((t) => {
            const active = tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={
                  active
                    ? "rounded-full bg-[var(--brand-red)] px-4 py-2 text-xs font-extrabold text-white"
                    : "rounded-full border border-[var(--border)] bg-black/15 px-4 py-2 text-xs font-extrabold text-[var(--brand-gold)] hover:bg-black/25"
                }
              >
                {t === "all" ? "All tags" : t}
              </button>
            );
          })}
        </div>

        {hasFilters ? (
          <button type="button" onClick={clearFilters} className="mt-4 text-sm font-extrabold text-[var(--brand-gold)] underline-offset-4 hover:underline">
            Clear search and filters
          </button>
        ) : null}
      </section>

      {/* GRID */}
      <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((recipe) => {
          const mins = minutesLabel(recipe.prepMinutes, recipe.cookMinutes);
          const placeholder = recipe.image === PLACEHOLDER;

          return (
            <Link
              key={recipe.slug}
              href={`/recipes/${recipe.slug}`}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--brand-gold)]/50 hover:shadow-xl"
            >
              <div className="relative h-52 w-full border-b border-[var(--border)] bg-black/25">
                <Image
                  src={recipe.image}
                  alt={`${recipe.title} recipe`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={placeholder || recipe.imageIsPlaceholder ? "object-contain p-8 opacity-90" : "object-cover transition duration-500 group-hover:scale-[1.04]"}
                />

                {mins ? (
                  <span className="absolute right-3 top-3 rounded-xl bg-[var(--brand-red)] px-3 py-1 text-xs font-extrabold text-white shadow">
                    {mins}
                  </span>
                ) : null}
              </div>

              <div className="p-5">
                <h2 className="text-base font-extrabold tracking-wide text-[var(--brand-gold)] group-hover:underline">
                  {recipe.title}
                </h2>

                {recipe.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--text-soft)]">
                    {recipe.description}
                  </p>
                ) : null}

                {(recipe.tags ?? []).length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(recipe.tags ?? []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[var(--border)] bg-black/15 px-3 py-1 text-xs font-bold text-[var(--brand-gold)]/85"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </section>

      {filtered.length === 0 ? (
        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">No recipes found</h2>
          <p className="mt-2 text-[var(--text-soft)]">Try a broader ingredient or clear the current filters.</p>
          <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-extrabold text-white">Show all recipes</button>
        </section>
      ) : null}
    </>
  );
}
