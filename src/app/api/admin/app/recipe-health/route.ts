import { NextResponse } from "next/server";

import { updateRecipeMealTypes, updateRecipeServings } from "@/lib/admin/updateRecipeMealTypes";
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

    const submittedMealTypes: unknown[] = Array.isArray(body?.mealTypes) ? body.mealTypes : [];
    const mealTypes = Array.from(new Set(submittedMealTypes.filter((value): value is string => typeof value === "string" && allowed.has(value))));
    if (!mealTypes.length) return NextResponse.json({ ok: false, error: "Choose at least one classification." }, { status: 400 });

    const file = updateRecipeMealTypes(slug, mealTypes);
    return NextResponse.json({ ok: true, file, mealTypes });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update recipe." }, { status: 500 });
  }
}
