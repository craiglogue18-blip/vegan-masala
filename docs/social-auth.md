# Social Authentication

This document covers Instagram and Facebook authentication for Vegan Masala social publishing.

It also covers the renewable YouTube and TikTok connections used by the weekly scheduler.

## Current Model

The current system uses manually managed long-lived Meta tokens.
Automatic OAuth refresh is intentionally not implemented yet.

## Required Meta Environment Variables

Core variables:

- `META_ACCESS_TOKEN`
- `META_PAGE_ACCESS_TOKEN` (optional override for Facebook publishing)
- `META_IG_USER_ID`
- `META_PAGE_ID`

Optional future variables:

- `META_APP_ID`
- `META_APP_SECRET`

## Platform Requirements

Instagram publishing requires:

- `META_ACCESS_TOKEN`
- `META_IG_USER_ID`

Facebook publishing requires:

- `META_PAGE_ID`
- One of:
  - `META_PAGE_ACCESS_TOKEN`
  - `META_ACCESS_TOKEN`

Token precedence for Facebook publishing:

1. `META_PAGE_ACCESS_TOKEN`
2. fallback `META_ACCESS_TOKEN`

## Local Configuration

Use `.env.local` as the canonical local source.

Other env files can cause confusion if they contain partial or stale Meta values.
If multiple files exist, keep Meta values synchronized or remove legacy files after explicit review.

## Vercel Configuration

Set Meta environment variables in Vercel Project Settings:

- Production
- Preview (if used for social tests)

After changing token values in Vercel, redeploy or restart runtime so the new values are loaded.

## Diagnostics

Use:

- `GET /api/admin/social/meta-health`

This returns safe diagnostics only:

- whether Instagram config is complete
- whether Facebook config is complete
- missing variable names
- warnings
- token lengths only

The endpoint never returns token contents.

## Common Error Meanings

`META_CONFIG_ERROR: Missing ...`

- Required environment variable is not configured for that publish path.

`Session has expired`

- Token is no longer valid (often expired).

`user logged out`

- Token was invalidated by Meta due to user/account/app state changes.

`missing permissions`

- Token exists but does not have required scopes or page/IG asset access.

## Operational Notes

- Keep one authoritative token set per environment.
- Prefer long-lived page-level credentials for stability.
- Validate `meta-health` before running bulk queue publishing.

## YouTube

Create a Google OAuth web client with this authorised redirect URI:

`https://www.vegan-masala.com/api/youtube/callback`

Configure:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI` (optional when using the production URL above)
- `YOUTUBE_PRIVACY_STATUS` (`private`, `unlisted`, or `public`; defaults to `private`)

Open `/api/youtube/connect` once to authorise the Vegan Masala channel. The returned refresh token is stored in the existing Upstash/KV store and renewed by Google's client library during uploads.

## TikTok

Create a TikTok developer app with Login Kit and Content Posting API, request the `video.publish` scope, and register:

`https://www.vegan-masala.com/api/tiktok/callback`

Configure:

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI` (optional when using the production URL above)
- `TIKTOK_DIRECT_POST_ENABLED=true` only after the app can use Direct Post
- `TIKTOK_PRIVACY_LEVEL=SELF_ONLY` while the client is unaudited
- `TIKTOK_MARK_AIGC=true` only when a generated video should carry TikTok's AI label

Open `/api/tiktok/connect` once to authorise the account. TikTok access tokens last about 24 hours; the stored refresh token is automatically exchanged and rotated before publishing. Videos are uploaded directly to TikTok rather than relying on a public media-domain verification.

TikTok restricts posts from unaudited Direct Post clients to private visibility. Do not change the privacy level to `PUBLIC_TO_EVERYONE` until TikTok has approved the app and exposes that option for the connected account.

Both renewable connections require the existing `KV_REST_API_URL` and `KV_REST_API_TOKEN` settings. Safe connection status is available at `GET /api/admin/social/platform-health`.
