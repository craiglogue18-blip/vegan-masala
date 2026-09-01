import type { Recipe } from "@/lib/recipes";
import { getRecipeDepth } from "@/lib/recipeDepth";


function countWords(value: string) {
  return value
    .replace(/^---[\s\S]*?---/m, " ")
    .replace(/[#*_>`[\](){}|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function isRecipeReadyForIndex(recipe: Recipe) {
  if (recipe.indexable === false) return false;
  if (getRecipeDepth(recipe.slug)) return true;

  const ingredients = recipe.ingredients?.length ?? 0;
  const instructions = recipe.instructions?.length ?? 0;
  const notes = recipe.notes?.length ?? 0;
  const bodyWords = countWords(recipe.content ?? "");

  return ingredients >= 8 && instructions >= 5 && notes >= 3 && bodyWords >= 300;
}
