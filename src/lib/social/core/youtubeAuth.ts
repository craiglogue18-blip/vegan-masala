import { google } from "googleapis";
import { loadSocialToken } from "./socialTokenStore";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing; YouTube OAuth is not configured`);
  return value;
}

export function youtubeRedirectUri() {
  return (
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "")}/api/youtube/callback`
  );
}

export function youtubeOauthClient() {
  return new google.auth.OAuth2(
    required("YOUTUBE_CLIENT_ID"),
    required("YOUTUBE_CLIENT_SECRET"),
    youtubeRedirectUri()
  );
}

export async function youtubeRefreshToken() {
  const stored = await loadSocialToken("youtube");
  return stored?.refresh_token || process.env.YOUTUBE_REFRESH_TOKEN?.trim() || "";
}
