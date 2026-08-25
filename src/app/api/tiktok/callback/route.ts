import { NextResponse } from "next/server";
import { SOCIAL_OAUTH_COOKIE, validOauthState } from "@/lib/social/core/oauthState";
import { exchangeTikTokCode } from "@/lib/social/core/tiktokAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stateCookie = req.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === SOCIAL_OAUTH_COOKIE)?.[1];
  if (!validOauthState("tiktok", url.searchParams.get("state"), stateCookie)) {
    return NextResponse.json({ ok: false, error: "Invalid or expired TikTok connection request" }, { status: 400 });
  }
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ ok: false, error: url.searchParams.get("error_description") || url.searchParams.get("error") || "TikTok returned no authorization code" }, { status: 400 });
  }
  try {
    await exchangeTikTokCode(code);
    const response = NextResponse.redirect(new URL("/admin/social/queue?tiktok=connected", req.url));
    response.cookies.delete(SOCIAL_OAUTH_COOKIE);
    return response;
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "TikTok token exchange failed" }, { status: 500 });
  }
}
