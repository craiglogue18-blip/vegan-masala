import { NextResponse } from "next/server";

import { getPublicRecipes } from "@/lib/recipes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const recipes = getPublicRecipes()
    .map((recipe) => {
      const stepVideos = (recipe.stepVideos ?? []).filter(Boolean);
      return {
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description ?? "",
        instructions: recipe.instructions ?? [],
        hasPublishedVideo: stepVideos.length > 0,
        publishedVideoCount: stepVideos.length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json(recipes, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
