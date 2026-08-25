import {
  loadSocialToken,
  saveSocialToken,
  tokenIsFresh,
} from "./socialTokenStore";

const TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing; TikTok OAuth is not configured`);
  return value;
}

export function tiktokClientKey() {
  return required("TIKTOK_CLIENT_KEY");
}

export function tiktokRedirectUri() {
  return (
    process.env.TIKTOK_REDIRECT_URI?.trim() ||
    `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "")}/api/tiktok/callback`
  );
}

export async function exchangeTikTokCode(code: string) {
  return requestToken({
    client_key: tiktokClientKey(),
    client_secret: required("TIKTOK_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: tiktokRedirectUri(),
  });
}

async function requestToken(fields: Record<string, string>) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error_description || data?.error || "TikTok token exchange failed");
  }
  await saveSocialToken("tiktok", data);
  return data;
}

export async function getTikTokAccessToken() {
  const stored = await loadSocialToken("tiktok");
  if (tokenIsFresh(stored)) return stored?.access_token || "";

  const refreshToken = stored?.refresh_token || process.env.TIKTOK_REFRESH_TOKEN?.trim();
  if (refreshToken) {
    const refreshed = await requestToken({
      client_key: tiktokClientKey(),
      client_secret: required("TIKTOK_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    return refreshed.access_token || "";
  }

  return process.env.TIKTOK_ACCESS_TOKEN?.trim() || "";
}
