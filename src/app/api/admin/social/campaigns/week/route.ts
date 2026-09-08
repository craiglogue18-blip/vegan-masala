import { NextResponse } from "next/server";

import { CAMPAIGNS, type CampaignKind } from "@/lib/social/campaigns/catalog";
import { buildCampaignCopy } from "@/lib/social/campaigns/copy";
import { renderCampaign } from "@/lib/social/campaigns/render";
import { addQueueItem, allQueueItems } from "@/lib/social/core/queue";
import { detectContentTypeBySlug } from "@/lib/social/core/content";

export const maxDuration = 300;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

const WEEK: Array<{ kind: CampaignKind; slug: string }> = [
  { kind: "ingredient", slug: "chana-masala" },
  { kind: "technique", slug: "chapati-recipe" },
  { kind: "affiliate", slug: "spices" },
  { kind: "mistake", slug: "aloo-baingan-recipe" },
  { kind: "behind-the-recipe", slug: "aloo-muttar" },
  { kind: "meal-planner", slug: "beginner-friendly-vegan-indian-recipes" },
  { kind: "dinner-plan", slug: "beginner-friendly-vegan-indian-recipes" },
];

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function scheduleFor(dayOffset: number) {
  const date = new Date(Date.now() + dayOffset * 86_400_000);
  const key = dateKey(date);
  const offset = new Date(`${key}T12:00:00Z`).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "longOffset",
  }).match(/GMT([+-]\d{2}:\d{2})/)?.[1] || "+00:00";
  return new Date(`${key}T10:45:00${offset}`).toISOString();
}

export async function POST() {
  try {
    const existing = await allQueueItems();
    const results: Array<{ kind: CampaignKind; ok: boolean; error?: string; scheduledFor?: string }> = [];

    for (let index = 0; index < WEEK.length; index += 1) {
      const entry = WEEK[index];
      const scheduledFor = scheduleFor(index + 1);
      const scheduledDay = dateKey(new Date(scheduledFor));
      const duplicate = existing.some(
        (item) =>
          item.campaignKind === entry.kind &&
          item.status === "queued" &&
          dateKey(new Date(item.scheduledFor)) === scheduledDay
      );

      if (duplicate) {
        results.push({ kind: entry.kind, ok: true, scheduledFor });
        continue;
      }

      try {
        const definition = CAMPAIGNS.find((campaign) => campaign.id === entry.kind);
        if (!definition) throw new Error("Campaign definition not found");
        const sourceSlug = definition.source === "none" ? undefined : entry.slug;
        const copy = await buildCampaignCopy(entry.kind, sourceSlug);
        const asset = await renderCampaign(copy, entry.kind, "video", sourceSlug);
        const contentType = detectContentTypeBySlug(entry.slug);
        if (!contentType) throw new Error(`Source content not found: ${entry.slug}`);

        await addQueueItem({
          slug: entry.slug,
          title: copy.title,
          platform: "instagram",
          caption: copy.captionVariants[0] || copy.caption,
          url: copy.destinationUrl,
          board: null,
          scheduledFor,
          contentType,
          kind: "standard",
          assetType: "video",
          imageUrl: asset.image,
          publishImageUrl: asset.publishImage,
          videoUrl: asset.video,
          requiresApproval: false,
          campaignKind: entry.kind,
        });
        results.push({ kind: entry.kind, ok: true, scheduledFor });
      } catch (error: unknown) {
        results.push({ kind: entry.kind, ok: false, error: errorMessage(error, "Generation failed") });
      }
    }

    const failed = results.filter((item) => !item.ok);
    return NextResponse.json({
      ok: failed.length === 0,
      count: results.length - failed.length,
      failed: failed.length,
      results,
      message: failed.length ? "Campaign week added with some failures" : "Seven campaign posts added",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error, "Could not add the campaign week") },
      { status: 500 }
    );
  }
}
