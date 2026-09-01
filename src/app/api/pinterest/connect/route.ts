import { NextResponse } from "next/server";
import { createOauthState, SOCIAL_OAUTH_COOKIE } from "@/lib/social/core/oauthState";

export async function GET() {
  const clientId = process.env.PINTEREST_APP_ID;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI;
  const scopes = process.env.PINTEREST_SCOPES;
  const state = createOauthState("pinterest");

  if (!clientId || !redirectUri || !scopes) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Pinterest environment variables",
      },
      { status: 500 }
    );
  }

  const authUrl =
    "https://www.pinterest.com/oauth/?" +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
    }).toString();

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(SOCIAL_OAUTH_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
