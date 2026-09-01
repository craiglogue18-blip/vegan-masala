import { NextResponse } from "next/server";
import { savePinterestToken } from "@/lib/social/core/pinterestToken";
import { SOCIAL_OAUTH_COOKIE, validOauthState } from "@/lib/social/core/oauthState";

function base64Credentials(clientId: string, clientSecret: string) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const stateCookie = req.headers.get("cookie")
      ?.split(";")
      .map((part) => part.trim().split("="))
      .find(([name]) => name === SOCIAL_OAUTH_COOKIE)?.[1];

    if (!validOauthState("pinterest", searchParams.get("state"), stateCookie)) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired Pinterest connection request" },
        { status: 400 }
      );
    }

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "No authorization code returned by Pinterest" },
        { status: 400 }
      );
    }

    const clientId = process.env.PINTEREST_APP_ID;
    const clientSecret = process.env.PINTEREST_APP_SECRET;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { ok: false, error: "Missing Pinterest environment variables" },
        { status: 500 }
      );
    }

    const authHeader = `Basic ${base64Credentials(clientId, clientSecret)}`;

    const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Pinterest token exchange failed",
          details: tokenData,
        },
        { status: 500 }
      );
    }

    const saved = await savePinterestToken(tokenData);

    const response = NextResponse.json({
      ok: saved,
      saved,
      hasAccessToken: Boolean(tokenData?.access_token),
      hasRefreshToken: Boolean(tokenData?.refresh_token),
      message: saved
        ? "Pinterest connected successfully. You can close this page."
        : "Pinterest authorized, but token storage is unavailable.",
    }, { status: saved ? 200 : 500 });
    response.cookies.delete(SOCIAL_OAUTH_COOKIE);
    return response;

  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Pinterest callback failed",
      },
      { status: 500 }
    );
  }
}
