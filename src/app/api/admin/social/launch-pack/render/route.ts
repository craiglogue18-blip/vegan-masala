import { NextResponse } from "next/server";

import { renderRecipeLaunchPack } from "@/lib/social/video/renderRecipeLaunchPack";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { ok: false, error: "Recipe launch-pack rendering is deliberately local-only. Open the admin hub on your Mac." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { packDirectory?: string; slug?: string; title?: string };
    const packDirectory = String(body.packDirectory || "").trim();
    const slug = String(body.slug || "").trim();
    const title = String(body.title || "").trim();
    if (!packDirectory || !slug || !title) {
      return NextResponse.json(
        { ok: false, error: "Choose a recipe and provide its RecipeWorks publishing-pack folder." },
        { status: 400 },
      );
    }

    const result = await renderRecipeLaunchPack({ packDirectory, slug, title });
    return NextResponse.json({
      ok: true,
      ...result,
      message: `${result.results.length} launch videos rendered locally with branded end cards. Nothing has been uploaded, queued or published.`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "The local launch pack could not be rendered." },
      { status: 500 },
    );
  }
}
