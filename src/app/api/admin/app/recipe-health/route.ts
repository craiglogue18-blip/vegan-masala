import { NextResponse } from "next/server";

import { updateRecipeIngredients, updateRecipeMealTypes, updateRecipePlannerTags, updateRecipeServings, updateRecipeStepVideos } from "@/lib/admin/updateRecipeMealTypes";
import { APP_MEAL_TYPES } from "@/lib/recipeAppHealth";

const allowed = new Set<string>(APP_MEAL_TYPES);

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Recipe editing is available locally only." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!slug) return NextResponse.json({ ok: false, error: "Recipe is required." }, { status: 400 });

    if (body?.action === "servings") {
      const servings = Number(body?.servings);
      if (!Number.isInteger(servings) || servings < 1 || servings > 100) return NextResponse.json({ ok: false, error: "Enter a whole number between 1 and 100." }, { status: 400 });
      const file = updateRecipeServings(slug, servings);
      return NextResponse.json({ ok: true, file, servings });
    }

    if (body?.action === "plannerTags") {
      const allowedTags = new Set(["quick", "low-cost", "high-protein", "family-friendly"]);
      const submitted: unknown[] = Array.isArray(body?.plannerTags) ? body.plannerTags : [];
      const plannerTags = Array.from(new Set(submitted.filter((value): value is string => typeof value === "string" && allowedTags.has(value))));
      const file = updateRecipePlannerTags(slug, plannerTags);
      return NextResponse.json({ ok: true, file, plannerTags });
    }

    if (body?.action === "ingredients") {
      const submitted: unknown[] = Array.isArray(body?.ingredients) ? body.ingredients : [];
      const ingredients = submitted.map((value) => typeof value === "string" ? value.trim() : "").filter(Boolean);
      if (!ingredients.length || ingredients.length > 100) return NextResponse.json({ ok: false, error: "Keep at least one ingredient." }, { status: 400 });
      const file = updateRecipeIngredients(slug, ingredients);
      return NextResponse.json({ ok: true, file, ingredients });
    }

    if (body?.action === "stepVideos") {
      const submitted: unknown[] = Array.isArray(body?.stepVideos) ? body.stepVideos : [];
      const stepVideos = submitted.map((value) => typeof value === "string" && value.trim() ? value.trim() : null);
      const invalid = stepVideos.find((value) => value && !/^(?:https?:\/\/|\/)/i.test(value));
      if (invalid) return NextResponse.json({ ok: false, error: "Video links must start with https:// or /." }, { status: 400 });
      const file = updateRecipeStepVideos(slug, stepVideos);
      return NextResponse.json({ ok: true, file, stepVideos });
    }

    const submittedMealTypes: unknown[] = Array.isArray(body?.mealTypes) ? body.mealTypes : [];
    const mealTypes = Array.from(new Set(submittedMealTypes.filter((value): value is string => typeof value === "string" && allowed.has(value))));
    if (!mealTypes.length) return NextResponse.json({ ok: false, error: "Choose at least one classification." }, { status: 400 });

    const file = updateRecipeMealTypes(slug, mealTypes);
    return NextResponse.json({ ok: true, file, mealTypes });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update recipe." }, { status: 500 });
  }
}
