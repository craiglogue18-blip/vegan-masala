import { Redis } from "@upstash/redis";

export type StoredSocialToken = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  scope?: string;
  token_type?: string;
  open_id?: string;
  saved_at: number;
};

type SocialTokenPlatform = "youtube" | "tiktok";

function getRedis() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function key(platform: SocialTokenPlatform) {
  return `social_auth:${platform}`;
}

export function socialTokenStorageConfigured() {
  return Boolean(getRedis());
}

export async function loadSocialToken(platform: SocialTokenPlatform) {
  const redis = getRedis();
  if (!redis) return null;
  return (await redis.get<StoredSocialToken>(key(platform))) || null;
}

export async function saveSocialToken(
  platform: SocialTokenPlatform,
  token: Omit<StoredSocialToken, "saved_at"> & { saved_at?: number }
) {
  const redis = getRedis();
  if (!redis) throw new Error("Social token storage is unavailable (KV missing)");

  const existing = await loadSocialToken(platform);
  await redis.set(key(platform), {
    ...existing,
    ...token,
    refresh_token: token.refresh_token || existing?.refresh_token,
    saved_at: token.saved_at || Date.now(),
  });
}

export function tokenIsFresh(token: StoredSocialToken | null, marginMs = 5 * 60_000) {
  if (!token?.access_token) return false;
  if (!token.expires_in) return true;
  return token.saved_at + token.expires_in * 1000 - Date.now() > marginMs;
}
