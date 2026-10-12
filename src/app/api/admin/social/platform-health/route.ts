import { NextResponse } from "next/server";
import { tikTokPublishingConfigured } from "@/lib/social/publishers/publishTikTok";
import { youtubePublishingConfigured } from "@/lib/social/publishers/publishYouTube";

export async function GET() {
  const [youtubeConfigured, tiktokConfigured] = await Promise.all([
    youtubePublishingConfigured(),
    tikTokPublishingConfigured(),
  ]);
  return NextResponse.json({
    ok: true,
    automation: {
      cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
      persistentQueueConfigured: Boolean(
        process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim()
      ),
    },
    youtube: {
      configured: youtubeConfigured,
      privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS?.trim() || "public",
      missing: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"].filter(
        (name) => !process.env[name]?.trim()
      ),
    },
    tiktok: {
      configured: tiktokConfigured,
      directPostEnabled:
        process.env.TIKTOK_DIRECT_POST_ENABLED?.trim().toLowerCase() === "true",
      privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL?.trim() || "PUBLIC_TO_EVERYONE",
      missing: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"].filter(
        (name) => !process.env[name]?.trim()
      ),
    },
  });
}
