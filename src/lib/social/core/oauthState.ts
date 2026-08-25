import crypto from "node:crypto";

export const SOCIAL_OAUTH_COOKIE = "vegan_masala_social_oauth";

export function createOauthState(platform: "youtube" | "tiktok") {
  return `${platform}.${crypto.randomBytes(24).toString("base64url")}`;
}

export function validOauthState(
  platform: "youtube" | "tiktok",
  queryState: string | null,
  cookieState: string | undefined
) {
  if (!queryState || !cookieState || !queryState.startsWith(`${platform}.`)) return false;
  const query = Buffer.from(queryState);
  const cookie = Buffer.from(cookieState);
  return query.length === cookie.length && crypto.timingSafeEqual(query, cookie);
}
