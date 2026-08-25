import { NextResponse } from "next/server";
import { SOCIAL_OAUTH_COOKIE, validOauthState } from "@/lib/social/core/oauthState";
import { saveSocialToken } from "@/lib/social/core/socialTokenStore";
import { youtubeOauthClient } from "@/lib/social/core/youtubeAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stateCookie = req.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === SOCIAL_OAUTH_COOKIE)?.[1];

  if (!validOauthState("youtube", url.searchParams.get("state"), stateCookie)) {
    return NextResponse.json({ ok: false, error: "Invalid or expired YouTube connection request" }, { status: 400 });
  }
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ ok: false, error: url.searchParams.get("error") || "YouTube returned no authorization code" }, { status: 400 });
  }

  try {
    const { tokens } = await youtubeOauthClient().getToken(code);
    if (!tokens.refresh_token) throw new Error("Google returned no refresh token; reconnect and grant offline access");
    await saveSocialToken("youtube", {
      access_token: tokens.access_token || undefined,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000)) : undefined,
      scope: tokens.scope || undefined,
      token_type: tokens.token_type || undefined,
    });
    const response = NextResponse.redirect(new URL("/admin/social/queue?youtube=connected", req.url));
    response.cookies.delete(SOCIAL_OAUTH_COOKIE);
    return response;
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "YouTube token exchange failed" }, { status: 500 });
  }
}
