import { NextResponse } from "next/server";

import { getAllRecipeSlugs } from "@/lib/recipes";
import { getTrendingSlugs } from "@/lib/trending";

export async function GET() {
  const valid = new Set(getAllRecipeSlugs());
  const slugs = (await getTrendingSlugs(8).catch(() => [])).filter((slug) => valid.has(slug));

  return NextResponse.json(
    { ok: true, slugs },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
