import { NextResponse } from "next/server";
import { tikTokPublishingConfigured } from "@/lib/social/publishers/publishTikTok";
import { youtubePublishingConfigured } from "@/lib/social/publishers/publishYouTube";

export async function GET() {
  return NextResponse.json({
    ok: true,
    youtube: {
      configured: youtubePublishingConfigured(),
      privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS?.trim() || "private",
      missing: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"].filter(
        (name) => !process.env[name]?.trim()
      ),
    },
    tiktok: {
      configured: tikTokPublishingConfigured(),
      directPostEnabled:
        process.env.TIKTOK_DIRECT_POST_ENABLED?.trim().toLowerCase() === "true",
      privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL?.trim() || "SELF_ONLY",
      missing: ["TIKTOK_ACCESS_TOKEN"].filter((name) => !process.env[name]?.trim()),
    },
  });
}
