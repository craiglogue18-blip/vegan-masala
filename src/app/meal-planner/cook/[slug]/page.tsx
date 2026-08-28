import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRecipeBySlug } from "@/lib/recipes";

import CookingMode from "./CookingMode";

function extractList(block: string | undefined, numbered: boolean) {
  if (!block) return [];
  const pattern = numbered ? /^\d+\.\s+/ : /^-+\s+/;
  return block.split("\n").map((line) => line.trim()).filter((line) => pattern.test(line)).map((line) => line.replace(pattern, "").trim()).filter(Boolean);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  return { title: recipe ? `Cook ${recipe.title} | Vegan Masala` : "Cooking mode | Vegan Masala" };
}

export default async function CookingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ batch?: string }> }) {
  const { slug } = await params;
  const { batch } = await searchParams;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  const ingredients = recipe.ingredients?.length ? recipe.ingredients : extractList(recipe.ingredientsMarkdown, false);
  const steps = recipe.instructions?.length ? recipe.instructions : extractList(recipe.methodMarkdown, true);

  return <CookingMode batchMultiplier={batch === "2" ? 2 : 1} recipe={{ slug: recipe.slug, title: recipe.title, image: recipe.image, ingredients, steps, totalMinutes: (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0) }} />;
}
