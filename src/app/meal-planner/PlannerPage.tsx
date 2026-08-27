import { getAllRecipes } from "@/lib/recipes";

import MealPlanner, { type PlannerView } from "./MealPlanner";

export default function PlannerPage({ view }: { view: PlannerView }) {
  const recipes = getAllRecipes().map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    tags: recipe.tags ?? [],
    mealTypes: recipe.mealTypes ?? [],
    plannerTags: recipe.plannerTags ?? [],
    ingredients: recipe.ingredients ?? [],
    spiceLevel: recipe.spiceLevel ?? recipe.spice,
  }));

  return <MealPlanner recipes={recipes} view={view} />;
}
