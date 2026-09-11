import { NextResponse } from "next/server";

import {
  generateNewsletterDraft,
  newsletterGuideChoices,
  newsletterRecipeChoices,
  renderNewsletterHtml,
  validateNewsletterDraft,
} from "@/lib/newsletters";
import { createKitNewsletter, getKitOverview } from "@/lib/kit-newsletters";

export const maxDuration = 120;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function GET() {
  const kit = await getKitOverview();
  return NextResponse.json({ ok: true, recipes: newsletterRecipeChoices(), guides: newsletterGuideChoices(), kit });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");

    if (action === "generate") {
      const requestedSlugs: string[] = Array.isArray(body?.slugs)
        ? body.slugs.map((slug: unknown) => String(slug || "").trim()).filter((slug: string) => Boolean(slug))
        : [];
      const slugs = [...new Set<string>(requestedSlugs)];
      if (slugs.length < 1 || slugs.length > 5) return NextResponse.json({ ok: false, error: "Choose between one and five recipes" }, { status: 400 });
      const newsletter = await generateNewsletterDraft(slugs, String(body?.theme || ""), {
        guideSlug: String(body?.guideSlug || "") || undefined,
        includeAffiliate: body?.includeAffiliate !== false,
      });
      return NextResponse.json({ ok: true, newsletter, html: renderNewsletterHtml(newsletter) });
    }

    if (action === "preview") {
      const newsletter = validateNewsletterDraft(body?.newsletter);
      return NextResponse.json({ ok: true, html: renderNewsletterHtml(newsletter) });
    }

    if (!["draft", "schedule", "send"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Choose draft, schedule or send" }, { status: 400 });
    }

    const newsletter = validateNewsletterDraft(body?.newsletter);
    const overview = await getKitOverview();
    if (!overview.configured || overview.subscribers === null) throw new Error(overview.error || "Kit is not connected");

    if (action !== "draft" && Number(body?.confirmedRecipientCount) !== overview.subscribers) {
      return NextResponse.json({ ok: false, error: `Confirm the current audience of ${overview.subscribers} subscribers before sending` }, { status: 409 });
    }

    let sendAt: string | null = null;
    if (action === "send") sendAt = new Date().toISOString();
    if (action === "schedule") {
      const scheduled = new Date(String(body?.sendAt || ""));
      if (!Number.isFinite(scheduled.getTime()) || scheduled.getTime() < Date.now() + 60_000) {
        return NextResponse.json({ ok: false, error: "Choose a schedule time at least one minute in the future" }, { status: 400 });
      }
      sendAt = scheduled.toISOString();
    }

    const publishToWeb = Boolean(body?.publishToWeb);
    const { broadcast } = await createKitNewsletter(newsletter, { sendAt, publishToWeb });

    return NextResponse.json({
      ok: true,
      action,
      recipients: overview.subscribers,
      broadcast,
      kitUrl: broadcast?.id ? `https://app.kit.com/campaigns/${broadcast.id}/draft` : "https://app.kit.com/campaigns",
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: errorMessage(error, "Newsletter request failed") }, { status: 500 });
  }
}
