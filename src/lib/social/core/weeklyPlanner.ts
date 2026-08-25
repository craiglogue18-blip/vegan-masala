import { buildFacebookCaption, buildInstagramCaption, buildPinterestCaption } from "./captions";
import { allContent, slugFromFile, titleFromSlug } from "./content";
import { addQueueItem, allQueueItems, type QueueItem, type QueuePlatform } from "./queue";
import { contentUrl } from "./urls";
import { generatePinterestBySlug } from "../generatePinterest";
import { buildRecipeVideo } from "../video/buildRecipeVideo";
import { getSocialCopyForSlug } from "./socialCopy";
import { tikTokPublishingConfigured } from "../publishers/publishTikTok";
import { youtubePublishingConfigured } from "../publishers/publishYouTube";

const PLATFORM_TIMES: Record<QueuePlatform, { hour: number; minute: number }> = {
  pinterest: { hour: 9, minute: 15 },
  instagram: { hour: 12, minute: 15 },
  facebook: { hour: 18, minute: 15 },
  tiktok: { hour: 15, minute: 15 },
  youtube: { hour: 17, minute: 15 },
};

const SLOT_DAYS = [2, 5] as const; // Tuesday and Friday (UTC)

type WeeklySlot = {
  date: string;
  slug: string;
  title: string;
  existingPlatforms: QueuePlatform[];
};

function startOfCurrentWeek(now: Date) {
  const start = new Date(now);
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function nextPlanningWeek(now: Date) {
  const monday = startOfCurrentWeek(now);
  // Monday's cron fills the current week. Later manual runs fill next week once
  // Friday's posting window has passed.
  if (now.getUTCDay() > 5 || (now.getUTCDay() === 5 && now.getUTCHours() >= 19)) {
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return monday;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function scheduleFor(date: string, platform: QueuePlatform) {
  const { hour, minute } = PLATFORM_TIMES[platform];
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

function recipeSlugs() {
  return allContent()
    .filter((item) => item.type === "recipe")
    .map((item) => slugFromFile(item.file));
}

function lastUseBySlug(items: QueueItem[]) {
  const result = new Map<string, number>();
  for (const item of items) {
    if (item.contentType && item.contentType !== "recipe") continue;
    const timestamp = new Date(item.createdAt || item.scheduledFor).getTime();
    result.set(item.slug, Math.max(result.get(item.slug) || 0, timestamp || 0));
  }
  return result;
}

function chooseRecipe(
  candidates: string[],
  items: QueueItem[],
  excluded: Set<string>,
  salt: string
) {
  const lastUse = lastUseBySlug(items);
  const available = candidates.filter((slug) => !excluded.has(slug));
  if (!available.length) throw new Error("No recipes available for weekly social planning");

  return available.sort((a, b) => {
    const ageDifference = (lastUse.get(a) || 0) - (lastUse.get(b) || 0);
    if (ageDifference !== 0) return ageDifference;
    return `${salt}:${a}`.localeCompare(`${salt}:${b}`);
  })[0];
}

function itemsForSlot(items: QueueItem[], date: string) {
  return items.filter(
    (item) =>
      item.contentType === "recipe" &&
      item.scheduledFor.slice(0, 10) === date &&
      (item.status === "queued" || item.status === "posted")
  );
}

export async function planWeeklySocialPosts(options?: {
  now?: Date;
  dryRun?: boolean;
  pinterestBoardId?: string;
}) {
  const now = options?.now || new Date();
  const monday = nextPlanningWeek(now);
  const items = await allQueueItems();
  const recipes = recipeSlugs();
  const excluded = new Set<string>();
  const slots: WeeklySlot[] = [];

  for (const day of SLOT_DAYS) {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + day - 1);
    const dateString = isoDate(date);
    const existing = itemsForSlot(items, dateString);
    const existingSlug = existing[0]?.slug;
    const slug = existingSlug || chooseRecipe(recipes, items, excluded, dateString);
    excluded.add(slug);
    slots.push({
      date: dateString,
      slug,
      title: titleFromSlug(slug),
      existingPlatforms: existing
        .filter((item) => item.slug === slug)
        .map((item) => item.platform),
    });
  }

  const board = options?.pinterestBoardId || process.env.PINTEREST_BOARD_ID?.trim() || "";
  const [tiktokConnected, youtubeConnected] = await Promise.all([
    tikTokPublishingConfigured(),
    youtubePublishingConfigured(),
  ]);
  const enabledPlatforms: QueuePlatform[] = board
    ? ["pinterest", "instagram", "facebook"]
    : ["instagram", "facebook"];
  if (tiktokConnected) enabledPlatforms.push("tiktok");
  if (youtubeConnected) enabledPlatforms.push("youtube");

  const warnings = board
    ? []
    : ["Pinterest skipped because PINTEREST_BOARD_ID is not configured"];
  if (!tiktokConnected) {
    warnings.push("TikTok skipped until an approved Direct Post connection is configured");
  }
  if (!youtubeConnected) {
    warnings.push("YouTube skipped until OAuth upload credentials are configured");
  }

  if (options?.dryRun) {
    return { dryRun: true, created: 0, slots, enabledPlatforms, warnings };
  }

  let created = 0;
  for (const slot of slots) {
    const missing = enabledPlatforms.filter(
      (platform) => !slot.existingPlatforms.includes(platform)
    );
    if (!missing.length) continue;

    const pinterestAsset = missing.includes("pinterest")
      ? await generatePinterestBySlug(slot.slug)
      : null;
    const pinterestUrl = String(pinterestAsset?.image || "");
    const needsVideo = missing.some((platform) =>
      ["instagram", "facebook", "tiktok", "youtube"].includes(platform)
    );
    const videoAsset = needsVideo ? await buildRecipeVideo(slot.slug) : null;
    const videoUrl = String(videoAsset?.video || "");
    const url = contentUrl(slot.slug, "recipe");
    const socialCopy = missing.some((platform) => platform === "tiktok" || platform === "youtube")
      ? await getSocialCopyForSlug(slot.slug)
      : null;

    for (const platform of missing) {
      const caption = platform === "pinterest"
        ? buildPinterestCaption(slot.slug, "recipe")
        : platform === "facebook"
          ? buildFacebookCaption(slot.slug, "recipe")
          : platform === "tiktok"
            ? socialCopy?.tiktokCaption || buildInstagramCaption(slot.slug, "recipe")
            : platform === "youtube"
              ? `${socialCopy?.youtubeDescription || buildFacebookCaption(slot.slug, "recipe")}\n\nFull recipe: ${url}`
              : buildInstagramCaption(slot.slug, "recipe");
      const isVideo = platform !== "pinterest";
      const imageUrl = platform === "pinterest" ? pinterestUrl : "";

      await addQueueItem({
        slug: slot.slug,
        title: slot.title,
        platform,
        caption,
        url,
        board: platform === "pinterest" ? board : null,
        scheduledFor: scheduleFor(slot.date, platform),
        contentType: "recipe",
        assetType: isVideo ? "video" : "image",
        imageUrl,
        publishImageUrl: imageUrl,
        videoUrl: isVideo ? videoUrl : "",
      });
      created++;
    }
  }

  return { dryRun: false, created, slots, warnings };
}
