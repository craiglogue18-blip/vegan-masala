import { Redis } from "@upstash/redis";

function redisClient() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function weekKey() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `recipe_views:${now.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

export async function recordRecipeView(slug: string) {
  const redis = redisClient();
  if (!redis) return false;
  const key = weekKey();
  await redis.zincrby(key, 1, slug);
  await redis.expire(key, 60 * 60 * 24 * 28);
  return true;
}

export async function getTrendingSlugs(limit = 6) {
  const redis = redisClient();
  if (!redis) return [];
  return redis.zrange<string[]>(weekKey(), 0, Math.max(0, limit - 1), { rev: true });
}

export async function getTrendingRecipesWithCounts(limit = 8) {
  const redis = redisClient();
  if (!redis) return [];
  const slugs = await redis.zrange<string[]>(weekKey(), 0, Math.max(0, limit - 1), { rev: true });
  const scores = await Promise.all(slugs.map((slug) => redis.zscore(weekKey(), slug)));
  return slugs.map((slug, index) => ({ slug, views: Number(scores[index]) || 0 }));
}
