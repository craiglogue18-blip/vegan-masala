"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type TrendingRecipe = {
  slug: string;
  title: string;
  description: string;
  image: string;
  totalMinutes: number;
};

export default function TrendingRecipes({ recipes }: { recipes: TrendingRecipe[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/engagement/trending")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setSlugs(Array.isArray(data?.slugs) ? data.slugs : []))
      .catch(() => undefined);
  }, []);

  const ordered = useMemo(() => {
    if (!slugs.length) return recipes.slice(0, 4);
    const rank = new Map(slugs.map((slug, index) => [slug, index]));
    const live = recipes.filter((recipe) => rank.has(recipe.slug)).sort((a, b) => (rank.get(a.slug) || 0) - (rank.get(b.slug) || 0));
    const fallback = recipes.filter((recipe) => !rank.has(recipe.slug));
    return [...live, ...fallback].slice(0, 4);
  }, [recipes, slugs]);

  return (
    <section className="vm-rise mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">Popular right now</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">Trending this week</h2>
        </div>
        <Link href="/recipes" className="text-sm font-bold text-[var(--text-soft)] hover:underline">Browse all →</Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ordered.map((recipe, index) => (
          <Link key={recipe.slug} href={`/recipes/${recipe.slug}`} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-44 overflow-hidden bg-black/20">
              <Image src={recipe.image} alt={recipe.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 25vw" />
              <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-red)] text-sm font-extrabold text-white">{index + 1}</span>
            </div>
            <div className="p-4">
              <h3 className="font-extrabold leading-snug text-[var(--brand-gold)] group-hover:underline">{recipe.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{recipe.description}</p>
              <p className="mt-3 text-xs font-bold text-[var(--brand-gold)]/75">{recipe.totalMinutes ? `${recipe.totalMinutes} min` : "Explore recipe"} · Cook this →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
