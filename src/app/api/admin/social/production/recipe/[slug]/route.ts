import { NextResponse } from "next/server";

import { getRecipeBySlug } from "@/lib/recipes";
import { buildRecipeFilmingSteps } from "@/lib/social/video/filmingPack";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return NextResponse.json({ ok: false, error: "Recipe not found." }, { status: 404 });

  const { preparation, method, steps } = buildRecipeFilmingSteps(recipe);

  return NextResponse.json({
    ok: true,
    recipe: {
      slug: recipe.slug,
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      preparation,
      method,
      steps,
    },
  });
}
