import { buildFacebookCaption, buildInstagramCaption, buildPinterestCaption } from "./captions";
import { allContent, slugFromFile, titleFromSlug, type ContentType } from "./content";
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

const PINTEREST_DAYS = [1, 2, 3, 4, 5] as const;
const CROSS_POST_DAYS = new Set([2, 5]);

type ContentCandidate = {
  slug: string;
  title: string;
  type: ContentType;
};

type WeeklySlot = ContentCandidate & {
  date: string;
  day: number;
  board: string;
  platforms: QueuePlatform[];
  existingPlatforms: QueuePlatform[];
};

function startOfCurrentWeek(now: Date) {
  const start = new Date(now);
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function nextPlanningWeek(now: Date) {
  const monday = startOfCurrentWeek(now);
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

function contentCandidates(): ContentCandidate[] {
  return allContent().map((item) => {
    const slug = slugFromFile(item.file);
    return { slug, title: titleFromSlug(slug), type: item.type };
  });
}

function lastUseBySlug(items: QueueItem[]) {
  const result = new Map<string, number>();
  for (const item of items) {
    const timestamp = new Date(item.createdAt || item.scheduledFor).getTime();
    result.set(item.slug, Math.max(result.get(item.slug) || 0, timestamp || 0));
  }
  return result;
}

function chooseContent(
  candidates: ContentCandidate[],
  items: QueueItem[],
  excluded: Set<string>,
  salt: string,
  preferredType: ContentType
) {
  const lastUse = lastUseBySlug(items);
  const unused = candidates.filter((item) => !excluded.has(item.slug));
  const preferred = unused.filter((item) => item.type === preferredType);
  const available = preferred.length ? preferred : unused;
  if (!available.length) throw new Error("No unused content available for weekly social planning");

  return [...available].sort((a, b) => {
    const ageDifference = (lastUse.get(a.slug) || 0) - (lastUse.get(b.slug) || 0);
    if (ageDifference !== 0) return ageDifference;
    return `${salt}:${a.slug}`.localeCompare(`${salt}:${b.slug}`);
  })[0];
}

function itemsForDate(items: QueueItem[], date: string) {
  return items.filter(
    (item) =>
      item.scheduledFor.slice(0, 10) === date &&
      (item.status === "queued" || item.status === "posted")
  );
}

function trackedUrl(slug: string, type: ContentType, platform: QueuePlatform) {
  const url = new URL(contentUrl(slug, type));
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", platform === "pinterest" ? "organic_social" : "organic_video");
  url.searchParams.set("utm_campaign", "weekly_content");
  return url.toString();
}

export async function planWeeklySocialPosts(options?: {
  now?: Date;
  dryRun?: boolean;
  pinterestBoardId?: string;
  pinterestRecipeBoardId?: string;
  pinterestGuideBoardId?: string;
}) {
  const now = options?.now || new Date();
  const monday = nextPlanningWeek(now);
  const items = await allQueueItems();
  const candidates = contentCandidates();
  const excluded = new Set<string>();

  const defaultBoard = options?.pinterestBoardId || process.env.PINTEREST_BOARD_ID?.trim() || "";
  const recipeBoard =
    options?.pinterestRecipeBoardId || process.env.PINTEREST_RECIPE_BOARD_ID?.trim() || defaultBoard;
  const guideBoard =
    options?.pinterestGuideBoardId || process.env.PINTEREST_GUIDE_BOARD_ID?.trim() || defaultBoard;

  const [tiktokConnected, youtubeConnected] = await Promise.all([
    tikTokPublishingConfigured(),
    youtubePublishingConfigured(),
  ]);

  const slots: WeeklySlot[] = [];
  for (const day of PINTEREST_DAYS) {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + day - 1);
    const dateString = isoDate(date);
    const existing = itemsForDate(items, dateString);
    const existingPinterest = existing.find((item) => item.platform === "pinterest");
    const preferredType: ContentType = day === 3 || day === 5 ? "guide" : "recipe";
    const chosen = existingPinterest
      ? candidates.find((item) => item.slug === existingPinterest.slug)
      : chooseContent(candidates, items, excluded, dateString, preferredType);

    if (!chosen) continue;
    excluded.add(chosen.slug);

    const platforms: QueuePlatform[] = defaultBoard ? ["pinterest"] : [];
    if (CROSS_POST_DAYS.has(day)) {
      platforms.push("instagram", "facebook");
      if (tiktokConnected) platforms.push("tiktok");
      if (youtubeConnected) platforms.push("youtube");
    }

    slots.push({
      ...chosen,
      date: dateString,
      day,
      board: chosen.type === "guide" ? guideBoard : recipeBoard,
      platforms,
      existingPlatforms: existing
        .filter((item) => item.slug === chosen.slug)
        .map((item) => item.platform),
    });
  }

  const warnings: string[] = [];
  if (!defaultBoard) warnings.push("Pinterest skipped because PINTEREST_BOARD_ID is not configured");
  if (defaultBoard && !process.env.PINTEREST_RECIPE_BOARD_ID) {
    warnings.push("Recipe Pins use the default board until PINTEREST_RECIPE_BOARD_ID is configured");
  }
  if (defaultBoard && !process.env.PINTEREST_GUIDE_BOARD_ID) {
    warnings.push("Guide Pins use the default board until PINTEREST_GUIDE_BOARD_ID is configured");
  }
  if (!tiktokConnected) warnings.push("TikTok skipped until an approved Direct Post connection is configured");
  if (!youtubeConnected) warnings.push("YouTube skipped until OAuth upload credentials are configured");

  if (options?.dryRun) {
    return {
      dryRun: true,
      created: 0,
      pinterestCount: slots.filter((slot) => slot.platforms.includes("pinterest")).length,
      uniqueContentCount: new Set(slots.map((slot) => slot.slug)).size,
      slots,
      enabledPlatforms: [...new Set(slots.flatMap((slot) => slot.platforms))],
      warnings,
    };
  }

  let created = 0;
  for (const slot of slots) {
    const missing = slot.platforms.filter(
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
    const socialCopy = missing.some((platform) => platform === "tiktok" || platform === "youtube")
      ? await getSocialCopyForSlug(slot.slug)
      : null;

    for (const platform of missing) {
      const url = trackedUrl(slot.slug, slot.type, platform);
      const caption = platform === "pinterest"
        ? buildPinterestCaption(slot.slug, slot.type)
        : platform === "facebook"
          ? buildFacebookCaption(slot.slug, slot.type)
          : platform === "tiktok"
            ? socialCopy?.tiktokCaption || buildInstagramCaption(slot.slug, slot.type)
            : platform === "youtube"
              ? `${socialCopy?.youtubeDescription || buildFacebookCaption(slot.slug, slot.type)}\n\nFull recipe: ${url}`
              : buildInstagramCaption(slot.slug, slot.type);
      const isVideo = platform !== "pinterest";

      await addQueueItem({
        slug: slot.slug,
        title: slot.title,
        platform,
        caption,
        url,
        board: platform === "pinterest" ? slot.board : null,
        scheduledFor: scheduleFor(slot.date, platform),
        contentType: slot.type,
        assetType: isVideo ? "video" : "image",
        imageUrl: platform === "pinterest" ? pinterestUrl : "",
        publishImageUrl: platform === "pinterest" ? pinterestUrl : "",
        videoUrl: isVideo ? videoUrl : "",
      });
      created++;
    }
  }

  return {
    dryRun: false,
    created,
    pinterestCount: slots.filter((slot) => slot.platforms.includes("pinterest")).length,
    uniqueContentCount: new Set(slots.map((slot) => slot.slug)).size,
    slots,
    warnings,
  };
}
