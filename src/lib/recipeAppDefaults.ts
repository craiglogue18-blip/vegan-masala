import type { Recipe } from "@/lib/recipes";

const HIGH_PROTEIN = /\b(tofu|chickpea|chana|chole|lentil|dal|dahl|rajma|bean|peas|soya|soy)\b/i;
const LOW_COST = /\b(potato|aloo|lentil|dal|dahl|chickpea|chana|bean|rice|cabbage|onion|pea|vegetable)\b/i;

export function suggestRecipePlannerTags(recipe: Recipe) {
  const text = [recipe.title, recipe.slug, ...(recipe.tags ?? []), ...(recipe.ingredients ?? [])].join(" ");
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const tags: string[] = [];

  if (totalMinutes > 0 && totalMinutes <= 30) tags.push("quick");
  if (LOW_COST.test(text)) tags.push("low-cost");
  if (HIGH_PROTEIN.test(text)) tags.push("high-protein");

  return tags;
}

/**
 * Supplies conservative app metadata when a recipe has no explicit value.
 * Explicit editorial metadata always wins. Because this runs in the shared
 * recipe loader, the website and installed app use the same repaired data.
 */
export function applySafeRecipeDefaults(recipe: Recipe): Recipe {
  if (recipe.plannerTags?.length) return recipe;

  return {
    ...recipe,
    plannerTags: suggestRecipePlannerTags(recipe),
  };
}
