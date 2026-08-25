import { NextResponse } from "next/server";
import { createOauthState, SOCIAL_OAUTH_COOKIE } from "@/lib/social/core/oauthState";
import { tiktokClientKey, tiktokRedirectUri } from "@/lib/social/core/tiktokAuth";

export async function GET() {
  try {
    const state = createOauthState("tiktok");
    const url = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: tiktokClientKey(),
      response_type: "code",
      scope: "video.publish",
      redirect_uri: tiktokRedirectUri(),
      state,
    })}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(SOCIAL_OAUTH_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });
    return response;
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "TikTok connection failed" }, { status: 500 });
  }
}
