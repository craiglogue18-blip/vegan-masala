import { NextResponse } from "next/server";

import { updateRecipeMealTypes } from "@/lib/admin/updateRecipeMealTypes";
import { APP_MEAL_TYPES } from "@/lib/recipeAppHealth";

const allowed = new Set<string>(APP_MEAL_TYPES);

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Recipe editing is available locally only." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const submittedMealTypes: unknown[] = Array.isArray(body?.mealTypes) ? body.mealTypes : [];
    const mealTypes = Array.from(new Set(submittedMealTypes.filter((value): value is string => typeof value === "string" && allowed.has(value))));
    if (!slug || !mealTypes.length) return NextResponse.json({ ok: false, error: "Choose at least one classification." }, { status: 400 });

    const file = updateRecipeMealTypes(slug, mealTypes);
    return NextResponse.json({ ok: true, file, mealTypes });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update recipe." }, { status: 500 });
  }
}
