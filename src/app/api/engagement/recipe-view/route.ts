import { NextResponse } from "next/server";

import { getAllRecipeSlugs } from "@/lib/recipes";
import { recordRecipeView } from "@/lib/trending";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";

  if (!slug || !getAllRecipeSlugs().includes(slug)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordRecipeView(slug).catch(() => false);
  return NextResponse.json({ ok: true });
}
