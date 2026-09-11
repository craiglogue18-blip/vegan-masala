import "server-only";

import { Redis } from "@upstash/redis";

import { createKitNewsletter } from "@/lib/kit-newsletters";
import { generateNewsletterDraft, newsletterGuideChoices, newsletterRecipeChoices } from "@/lib/newsletters";

const CONFIG_KEY = "newsletter:automation:config";
const STATE_KEY = "newsletter:automation:state";
const LOCK_KEY = "newsletter:automation:lock";
const TIME_ZONE = "Europe/London";

export type NewsletterAutomationConfig = {
  enabled: boolean;
  startAt: string;
  cadenceWeeks: 1 | 2;
  weekday: number;
  hour: number;
  minute: number;
  recipeCount: number;
  theme: string;
  publishToWeb: boolean;
  includeAffiliate: boolean;
  updatedAt: string;
};

export type NewsletterAutomationState = {
  lastRunAt?: string;
  lastSentAt?: string;
  lastBroadcastId?: number;
  lastSubject?: string;
  lastRecipientCount?: number;
  recentRecipeSlugs?: string[];
  recentGuideSlugs?: string[];
  editionCount?: number;
  lastError?: string;
};

export const DEFAULT_NEWSLETTER_AUTOMATION: NewsletterAutomationConfig = {
  enabled: true,
  startAt: "2026-09-17T09:00:00.000Z",
  cadenceWeeks: 2,
  weekday: 4,
  hour: 10,
  minute: 0,
  recipeCount: 3,
  theme: "A fresh selection from the Vegan Masala kitchen",
  publishToWeb: false,
  includeAffiliate: true,
  updatedAt: new Date(0).toISOString(),
};

function redisClient() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: weekdays[value("weekday")], hour: Number(value("hour")), minute: Number(value("minute")) };
}

export function validateNewsletterAutomation(value: unknown): NewsletterAutomationConfig {
  const input = value as Partial<NewsletterAutomationConfig>;
  const cadenceWeeks = Number(input?.cadenceWeeks);
  const startAt = new Date(String(input?.startAt || ""));
  const weekday = Number(input?.weekday);
  const hour = Number(input?.hour);
  const minute = Number(input?.minute);
  const recipeCount = Number(input?.recipeCount);
  if (![1, 2].includes(cadenceWeeks)) throw new Error("Cadence must be weekly or fortnightly");
  if (!Number.isFinite(startAt.getTime())) throw new Error("Choose a valid first delivery date");
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error("Choose a valid weekday");
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("Choose a valid hour");
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("Choose a valid minute");
  if (!Number.isInteger(recipeCount) || recipeCount < 1 || recipeCount > 5) throw new Error("Choose between one and five recipes");
  return {
    enabled: Boolean(input?.enabled),
    startAt: startAt.toISOString(),
    cadenceWeeks: cadenceWeeks as 1 | 2,
    weekday,
    hour,
    minute,
    recipeCount,
    theme: String(input?.theme || DEFAULT_NEWSLETTER_AUTOMATION.theme).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120),
    publishToWeb: Boolean(input?.publishToWeb),
    includeAffiliate: input?.includeAffiliate !== false,
    updatedAt: new Date().toISOString(),
  };
}

export async function getNewsletterAutomation() {
  const redis = redisClient();
  if (!redis) return { configured: false, config: DEFAULT_NEWSLETTER_AUTOMATION, state: {} as NewsletterAutomationState };
  const [savedConfig, state] = await Promise.all([
    redis.get<NewsletterAutomationConfig>(CONFIG_KEY),
    redis.get<NewsletterAutomationState>(STATE_KEY),
  ]);
  return {
    configured: true,
    config: savedConfig ? { ...DEFAULT_NEWSLETTER_AUTOMATION, ...savedConfig } : DEFAULT_NEWSLETTER_AUTOMATION,
    state: state || {},
  };
}

export async function saveNewsletterAutomation(value: unknown) {
  const redis = redisClient();
  if (!redis) throw new Error("Persistent storage is not configured");
  const config = validateNewsletterAutomation(value);
  await redis.set(CONFIG_KEY, config);
  return config;
}

function isDue(config: NewsletterAutomationConfig, state: NewsletterAutomationState, now: Date) {
  if (!config.enabled) return false;
  if (now.getTime() < new Date(config.startAt).getTime()) return false;
  const local = londonParts(now);
  if (local.weekday !== config.weekday) return false;
  if (local.hour < config.hour || (local.hour === config.hour && local.minute < config.minute)) return false;
  if (!state.lastSentAt) return true;
  return now.getTime() - new Date(state.lastSentAt).getTime() >= config.cadenceWeeks * 7 * 86_400_000 - 3_600_000;
}

function chooseRecipeSlugs(count: number, recent: string[] = []) {
  const available = newsletterRecipeChoices();
  if (available.length < count) throw new Error("There are not enough published recipes for the scheduled newsletter");
  const unseen = available.filter((recipe) => !recent.includes(recipe.slug));
  const pool = unseen.length >= count ? unseen : available;
  return pool.slice(0, count).map((recipe) => recipe.slug);
}

function chooseGuideSlug(recent: string[] = [], editionCount = 1) {
  const guides = newsletterGuideChoices();
  const editorialGuides = guides.filter((guide) => guide.slug !== "equipment");
  return editorialGuides.find((guide) => !recent.includes(guide.slug))?.slug
    || editorialGuides[(editionCount - 1) % editorialGuides.length]?.slug;
}

const EDITORIAL_ANGLES = [
  "Practical weeknight cooking: minimise fuss while preserving proper flavour and texture",
  "Technique edition: explain why one important cooking step changes the finished dish",
  "Pantry edition: show how versatile staples create distinctly different meals",
  "Regional discovery: connect the recipes to a genuine Indian cooking tradition without overclaiming",
  "Weekend cooking: choose rewarding recipes and useful preparation that readers can take their time over",
  "Cook once, eat well: focus on planning, useful leftovers and a varied week",
];

export async function runNewsletterAutomation(options: { force?: boolean } = {}) {
  const redis = redisClient();
  if (!redis) throw new Error("Persistent storage is not configured");
  const { config, state } = await getNewsletterAutomation();
  const now = new Date();
  if (!options.force && !isDue(config, state, now)) return { ok: true, sent: false, reason: config.enabled ? "Not due" : "Automation paused" };

  const lockValue = crypto.randomUUID();
  const locked = await redis.set(LOCK_KEY, lockValue, { nx: true, ex: 15 * 60 });
  if (!locked) return { ok: true, sent: false, reason: "Another newsletter run is already in progress" };

  const lastRunAt = now.toISOString();
  try {
    const slugs = chooseRecipeSlugs(config.recipeCount, state.recentRecipeSlugs || []);
    const editionCount = (state.editionCount || 0) + 1;
    const guideSlug = chooseGuideSlug(state.recentGuideSlugs || [], editionCount);
    if (!guideSlug) throw new Error("There are no published guides for the scheduled newsletter");
    const editorialAngle = EDITORIAL_ANGLES[(editionCount - 1) % EDITORIAL_ANGLES.length];
    const newsletter = await generateNewsletterDraft(slugs, config.theme, {
      guideSlug,
      includeAffiliate: config.includeAffiliate,
      editorialAngle,
    });
    const { overview, broadcast } = await createKitNewsletter(newsletter, {
      sendAt: new Date().toISOString(),
      publishToWeb: config.publishToWeb,
    });
    const nextState: NewsletterAutomationState = {
      lastRunAt,
      lastSentAt: new Date().toISOString(),
      lastBroadcastId: Number(broadcast?.id) || undefined,
      lastSubject: newsletter.subject,
      lastRecipientCount: overview.subscribers ?? undefined,
      recentRecipeSlugs: [...slugs, ...(state.recentRecipeSlugs || []).filter((slug) => !slugs.includes(slug))].slice(0, 30),
      recentGuideSlugs: [guideSlug, ...(state.recentGuideSlugs || []).filter((slug) => slug !== guideSlug)].slice(0, 12),
      editionCount,
      lastError: undefined,
    };
    await redis.set(STATE_KEY, nextState);
    return { ok: true, sent: true, recipients: overview.subscribers, subject: newsletter.subject, broadcastId: broadcast?.id || null };
  } catch (error: unknown) {
    const message = error instanceof Error && error.message ? error.message : "Scheduled newsletter failed";
    await redis.set(STATE_KEY, { ...state, lastRunAt, lastError: message });
    throw error;
  } finally {
    const currentLock = await redis.get<string>(LOCK_KEY);
    if (currentLock === lockValue) await redis.del(LOCK_KEY);
  }
}
