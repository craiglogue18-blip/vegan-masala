import "server-only";

import { Redis } from "@upstash/redis";
import { getGscPerformanceSnapshot } from "@/lib/seo/gsc";
import { allQueueItems } from "@/lib/social/core/queue";
import { getTrendingRecipesWithCounts } from "@/lib/trending";
import { getPinterestAccessToken } from "@/lib/social/core/pinterestToken";
import { getTikTokAccessToken } from "@/lib/social/core/tiktokAuth";

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

type AwinAmount = { amount?: unknown; currency?: unknown };
type AwinTransaction = {
  advertiserName?: unknown;
  commissionStatus?: unknown;
  commissionAmount?: AwinAmount;
  saleAmount?: AwinAmount;
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

async function getKitSubscriberCount(createdAfter?: string, createdBefore?: string) {
  const apiKey = process.env.KIT_API_KEY?.trim();
  if (!apiKey) return { configured: false, count: null, error: null };

  try {
    const url = new URL("https://api.kit.com/v4/subscribers");
    url.searchParams.set("include_total_count", "true");
    url.searchParams.set("per_page", "1");
    url.searchParams.set("slim", "true");
    url.searchParams.set("status", "active");
    if (createdAfter) url.searchParams.set("created_after", createdAfter);
    if (createdBefore) url.searchParams.set("created_before", createdBefore);

    const response = await fetch(url, {
      headers: { "X-Kit-Api-Key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { configured: true, count: null, error: "Kit reporting request failed" };

    const payload = (await response.json()) as {
      total_count?: unknown;
      pagination?: { total_count?: unknown };
    };
    const count = Number(payload.total_count ?? payload.pagination?.total_count);
    return {
      configured: true,
      count: Number.isFinite(count) ? count : null,
      error: Number.isFinite(count) ? null : "Kit did not return a subscriber total",
    };
  } catch {
    return { configured: true, count: null, error: "Kit reporting is temporarily unavailable" };
  }
}

function awinAmount(value: AwinAmount | undefined) {
  const amount = Number(value?.amount);
  return Number.isFinite(amount) ? amount : 0;
}

async function getAwinTransactions(offsetDays = 0) {
  const token = process.env.AWIN_API_TOKEN?.trim();
  const publisherId = process.env.AWIN_PUBLISHER_ID?.trim();
  if (!token || !publisherId) {
    return { configured: false, transactions: [] as AwinTransaction[], error: null };
  }

  const end = new Date(Date.now() - offsetDays * DAY_MS);
  const start = new Date(end.getTime() - 28 * DAY_MS);
  const timestamp = (date: Date, endOfDay = false) =>
    `${date.toISOString().slice(0, 10)}T${endOfDay ? "23:59:59" : "00:00:00"}`;
  const url = new URL(`https://api.awin.com/publishers/${encodeURIComponent(publisherId)}/transactions/`);
  url.searchParams.set("startDate", timestamp(start));
  url.searchParams.set("endDate", timestamp(end, true));
  url.searchParams.set("timezone", "Europe/London");

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return {
        configured: true,
        transactions: [] as AwinTransaction[],
        error: `Awin reporting request failed (${response.status})`,
      };
    }
    const payload = (await response.json()) as unknown;
    const transactions = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { transactions?: unknown })?.transactions)
        ? (payload as { transactions: AwinTransaction[] }).transactions
        : [];
    return { configured: true, transactions: transactions as AwinTransaction[], error: null };
  } catch {
    return {
      configured: true,
      transactions: [] as AwinTransaction[],
      error: "Awin reporting is temporarily unavailable",
    };
  }
}

function summariseAwin(transactions: AwinTransaction[]) {
  const status = (value: unknown) => String(value || "unknown").toLowerCase();
  const advertisers = new Map<string, { transactions: number; commission: number }>();
  let saleValue = 0;
  let commission = 0;
  let currency = "GBP";

  for (const transaction of transactions) {
    saleValue += awinAmount(transaction.saleAmount);
    commission += awinAmount(transaction.commissionAmount);
    currency = String(transaction.commissionAmount?.currency || transaction.saleAmount?.currency || currency);
    const name = String(transaction.advertiserName || "Unknown advertiser");
    const current = advertisers.get(name) ?? { transactions: 0, commission: 0 };
    current.transactions += 1;
    current.commission += awinAmount(transaction.commissionAmount);
    advertisers.set(name, current);
  }

  return {
    transactions: transactions.length,
    approved: transactions.filter((item) => status(item.commissionStatus) === "approved").length,
    pending: transactions.filter((item) => status(item.commissionStatus) === "pending").length,
    declined: transactions.filter((item) => status(item.commissionStatus) === "declined").length,
    saleValue,
    commission,
    currency,
    advertisers: [...advertisers.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.commission - a.commission || b.transactions - a.transactions)
      .slice(0, 8),
  };
}

type SocialSnapshot = {
  configured: boolean;
  followers: number | null;
  content: number | null;
  impressions: number | null;
  outboundClicks: number | null;
  error: string | null;
};

const emptySocial = (configured: boolean, error: string | null = null): SocialSnapshot => ({
  configured,
  followers: null,
  content: null,
  impressions: null,
  outboundClicks: null,
  error,
});

async function getMetaAudience() {
  const token = (process.env.META_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || "").trim();
  const pageId = process.env.META_PAGE_ID?.trim();
  const igId = process.env.META_IG_USER_ID?.trim();
  const request = async (id: string | undefined, fields: string) => {
    if (!token || !id) return null;
    const url = new URL(`https://graph.facebook.com/v23.0/${encodeURIComponent(id)}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", token);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("permission");
    return response.json() as Promise<Record<string, unknown>>;
  };
  try {
    const [facebook, instagram] = await Promise.all([
      request(pageId, "followers_count,fan_count"),
      request(igId, "followers_count,media_count"),
    ]);
    return {
      facebook: facebook ? { ...emptySocial(true), followers: Number(facebook.followers_count ?? facebook.fan_count) || 0 } : emptySocial(false),
      instagram: instagram ? { ...emptySocial(true), followers: Number(instagram.followers_count) || 0, content: Number(instagram.media_count) || 0 } : emptySocial(false),
    };
  } catch {
    const error = "Connected for publishing; audience reporting permission is still needed";
    return { facebook: emptySocial(Boolean(token && pageId), error), instagram: emptySocial(Boolean(token && igId), error) };
  }
}

async function getPinterestPerformance(): Promise<SocialSnapshot> {
  const configured = Boolean(process.env.PINTEREST_ACCESS_TOKEN || process.env.PINTEREST_CLIENT_ID);
  try {
    const token = await getPinterestAccessToken();
    if (!token) return emptySocial(configured, "Pinterest reporting token unavailable");
    const end = new Date();
    const start = new Date(end.getTime() - 28 * DAY_MS);
    const url = new URL("https://api.pinterest.com/v5/user_account/analytics");
    url.searchParams.set("start_date", start.toISOString().slice(0, 10));
    url.searchParams.set("end_date", end.toISOString().slice(0, 10));
    url.searchParams.set("metric_types", "IMPRESSION,OUTBOUND_CLICK");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return emptySocial(true, "Connected for publishing; analytics permission is still needed");
    const payload = (await response.json()) as { all?: { daily_metrics?: Array<{ metrics?: Record<string, unknown> }> } };
    const daily = payload.all?.daily_metrics ?? [];
    const sum = (metric: string) => daily.reduce((total, row) => total + (Number(row.metrics?.[metric]) || 0), 0);
    return { ...emptySocial(true), impressions: sum("IMPRESSION"), outboundClicks: sum("OUTBOUND_CLICK") };
  } catch {
    return emptySocial(configured, "Pinterest reporting is temporarily unavailable");
  }
}

async function getTikTokAudience(): Promise<SocialSnapshot> {
  const configured = dataSourceConfigured("TIKTOK");
  try {
    const token = await getTikTokAccessToken();
    if (!token) return emptySocial(configured, "TikTok reporting token unavailable");
    const url = new URL("https://open.tiktokapis.com/v2/user/info/");
    url.searchParams.set("fields", "follower_count,video_count,likes_count");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return emptySocial(true, "Connected for publishing; user statistics permission is still needed");
    const payload = (await response.json()) as { data?: { user?: Record<string, unknown> } };
    const user = payload.data?.user ?? {};
    return { ...emptySocial(true), followers: Number(user.follower_count) || 0, content: Number(user.video_count) || 0 };
  } catch {
    return emptySocial(configured, "TikTok reporting is temporarily unavailable");
  }
}

export async function getGrowthDashboard() {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 28 * DAY_MS).toISOString().slice(0, 10);
  const previousStart = new Date(now.getTime() - 56 * DAY_MS).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const [search, current, previous, queue, trending, recraft, kitTotal, kitCurrent, kitPrevious, awinCurrent, awinPrevious, metaAudience, pinterestPerformance, tiktokAudience] = await Promise.all([
    getGscPerformanceSnapshot({ rowLimit: 8 }),
    engagementWindow(28),
    engagementWindow(28, 28),
    allQueueItems().catch(() => []),
    getTrendingRecipesWithCounts(8).catch(() => []),
    getRecraftBalance(),
    getKitSubscriberCount(),
    getKitSubscriberCount(currentStart, today),
    getKitSubscriberCount(previousStart, currentStart),
    getAwinTransactions(),
    getAwinTransactions(28),
    getMetaAudience(),
    getPinterestPerformance(),
    getTikTokAudience(),
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
      kit: {
        configured: kitTotal.configured,
        activeSubscribers: kitTotal.count,
        newSubscribers: kitCurrent.count,
        previousNewSubscribers: kitPrevious.count,
        error: kitTotal.error || kitCurrent.error || kitPrevious.error,
      },
      awin: {
        configured: awinCurrent.configured,
        current: summariseAwin(awinCurrent.transactions),
        previous: summariseAwin(awinPrevious.transactions),
        error: awinCurrent.error || awinPrevious.error,
      },
      socialPerformance: {
        facebook: metaAudience.facebook,
        instagram: metaAudience.instagram,
        pinterest: pinterestPerformance,
        tiktok: tiktokAudience,
      },
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
