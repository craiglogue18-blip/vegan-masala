import { NextResponse } from "next/server";

import { CAMPAIGNS, type CampaignFormat, type CampaignKind, type CampaignStyle } from "@/lib/social/campaigns/catalog";
import { buildCampaignCopy } from "@/lib/social/campaigns/copy";
import { renderCampaign } from "@/lib/social/campaigns/render";

export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ ok: true, campaigns: CAMPAIGNS });
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const kind = String(body?.kind || "") as CampaignKind;
    const format = String(body?.format || "story") as CampaignFormat;
    const style = String(body?.style || "hero") as CampaignStyle;
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const definition = CAMPAIGNS.find((item) => item.id === kind);
    if (!definition) return NextResponse.json({ ok: false, error: "Choose a valid campaign" }, { status: 400 });
    if (!(["story", "video"] as string[]).includes(format)) return NextResponse.json({ ok: false, error: "Choose story or video" }, { status: 400 });
    if (!(["hero", "cooking", "ingredient", "carousel-cover"] as string[]).includes(style)) return NextResponse.json({ ok: false, error: "Choose a valid visual style" }, { status: 400 });
    if (definition.source !== "none" && !slug) return NextResponse.json({ ok: false, error: "Choose source content" }, { status: 400 });

    const copy = await buildCampaignCopy(kind, slug || undefined);
    const asset = await renderCampaign(copy, kind, format, slug || undefined, style);
    return NextResponse.json({ ok: true, kind, format, style, slug: slug || null, ...asset, buffer: undefined, copy });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Campaign generation failed" }, { status: 500 });
  }
}
