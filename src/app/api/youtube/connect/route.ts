import { NextResponse } from "next/server";
import { createOauthState, SOCIAL_OAUTH_COOKIE } from "@/lib/social/core/oauthState";
import { youtubeOauthClient } from "@/lib/social/core/youtubeAuth";

export async function GET() {
  try {
    const state = createOauthState("youtube");
    const url = youtubeOauthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
      ],
      state,
    });
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
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "YouTube connection failed" }, { status: 500 });
  }
}
