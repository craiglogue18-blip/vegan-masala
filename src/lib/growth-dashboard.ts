import "server-only";

import { Redis } from "@upstash/redis";
import { getGscPerformanceSnapshot } from "@/lib/seo/gsc";
import { allQueueItems } from "@/lib/social/core/queue";
import { getTrendingRecipesWithCounts } from "@/lib/trending";

const DAY_MS = 86_400_000;

type EngagementRow = {
  event: string;
  pagePath: string;
  source: string;
  campaign: string;
  placement: string;
  category: string;
  product: string;
  count: number;
};

function redisClient() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateKeys(days: number, offsetDays = 0) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (index + offsetDays) * DAY_MS);
    return `engagement:${isoDay(date)}`;
  });
}

function parseRows(hashes: Array<Record<string, number | string> | null>) {
  const rows: EngagementRow[] = [];
  for (const hash of hashes) {
    for (const [key, rawCount] of Object.entries(hash ?? {})) {
      const [event, pagePath, source, campaign, placement, category, product] = key.split(":");
      rows.push({
        event: event || "unknown",
        pagePath: pagePath || "unknown",
        source: source || "none",
        campaign: campaign || "none",
        placement: placement || "none",
        category: category || "none",
        product: product || "none",
        count: Number(rawCount) || 0,
      });
    }
  }
  return rows;
}

function total(rows: EngagementRow[], event: string) {
  return rows.filter((row) => row.event === event).reduce((sum, row) => sum + row.count, 0);
}

function rank(rows: EngagementRow[], event: string, field: keyof EngagementRow, limit = 8) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.event !== event) continue;
    const label = String(row[field] || "unknown");
    totals.set(label, (totals.get(label) ?? 0) + row.count);
  }
  return [...totals.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

async function engagementWindow(days: number, offsetDays = 0) {
  const redis = redisClient();
  if (!redis) return [];
  const hashes = await Promise.all(
    dateKeys(days, offsetDays).map((key) => redis.hgetall<Record<string, number | string>>(key))
  );
  return parseRows(hashes);
}

async function getRecraftBalance() {
  const token = process.env.RECRAFT_API_TOKEN?.trim();
  if (!token) return { configured: false, credits: null, error: null };

  try {
    const response = await fetch("https://external.api.recraft.ai/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return { configured: true, credits: null, error: "Recraft balance request failed" };
    }
    const payload = (await response.json()) as { credits?: unknown };
    const credits = Number(payload.credits);
    return {
      configured: true,
      credits: Number.isFinite(credits) ? credits : null,
      error: Number.isFinite(credits) ? null : "Recraft did not return a credit balance",
    };
  } catch {
    return { configured: true, credits: null, error: "Recraft balance is temporarily unavailable" };
  }
}

export async function getGrowthDashboard() {
  const [search, current, previous, queue, trending, recraft] = await Promise.all([
    getGscPerformanceSnapshot({ rowLimit: 8 }),
    engagementWindow(28),
    engagementWindow(28, 28),
    allQueueItems().catch(() => []),
    getTrendingRecipesWithCounts(8).catch(() => []),
    getRecraftBalance(),
  ]);

  const currentEvents = {
    affiliateClicks: total(current, "affiliate_click"),
    commerceClicks: total(current, "commerce_click"),
    planViews: total(current, "dinner_plan_view"),
    planStarts: total(current, "dinner_plan_form_start"),
    planSubmits: total(current, "dinner_plan_form_submit"),
    planConfirmed: total(current, "dinner_plan_confirmed"),
    planDownloads: total(current, "dinner_plan_download"),
  };
  const previousEvents = {
    affiliateClicks: total(previous, "affiliate_click"),
    commerceClicks: total(previous, "commerce_click"),
    planViews: total(previous, "dinner_plan_view"),
    planStarts: total(previous, "dinner_plan_form_start"),
    planSubmits: total(previous, "dinner_plan_form_submit"),
    planConfirmed: total(previous, "dinner_plan_confirmed"),
    planDownloads: total(previous, "dinner_plan_download"),
  };

  const social = {
    queued: queue.filter((item) => item.status === "queued").length,
    posted: queue.filter((item) => item.status === "posted").length,
    failed: queue.filter((item) => item.status === "failed").length,
    platforms: ["instagram", "facebook", "pinterest", "tiktok", "youtube"].map((platform) => ({
      platform,
      posted: queue.filter((item) => item.platform === platform && item.status === "posted").length,
      queued: queue.filter((item) => item.platform === platform && item.status === "queued").length,
      failed: queue.filter((item) => item.platform === platform && item.status === "failed").length,
    })),
  };

  return {
    generatedAt: new Date().toISOString(),
    search,
    engagementConnected: Boolean(redisClient()),
    current: currentEvents,
    previous: previousEvents,
    topAffiliateProducts: rank(current, "affiliate_click", "product"),
    topAffiliateSources: rank(current, "affiliate_click", "source"),
    topAffiliatePages: rank(current, "affiliate_click", "pagePath"),
    trending,
    social,
    services: {
      recraft,
      openAi: {
        configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
        usageConnected: Boolean(process.env.OPENAI_ADMIN_KEY?.trim()),
      },
      searchConsole: { configured: dataSourceConfigured("GSC") },
      meta: {
        configured: Boolean(
          process.env.META_ACCESS_TOKEN?.trim() &&
          process.env.META_PAGE_ID?.trim() &&
          process.env.META_IG_USER_ID?.trim()
        ),
      },
      pinterest: { configured: Boolean(process.env.PINTEREST_ACCESS_TOKEN?.trim()) },
      youtube: { configured: dataSourceConfigured("YOUTUBE") },
      tiktok: { configured: dataSourceConfigured("TIKTOK") },
    },
  };
}

function dataSourceConfigured(prefix: string) {
  return Object.keys(process.env).some(
    (name) => name.startsWith(`${prefix}_`) && Boolean(process.env[name]?.trim())
  );
}
