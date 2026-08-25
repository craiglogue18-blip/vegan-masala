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
    youtube: {
      configured: youtubeConfigured,
      privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS?.trim() || "private",
      missing: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"].filter(
        (name) => !process.env[name]?.trim()
      ),
    },
    tiktok: {
      configured: tiktokConfigured,
      directPostEnabled:
        process.env.TIKTOK_DIRECT_POST_ENABLED?.trim().toLowerCase() === "true",
      privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL?.trim() || "SELF_ONLY",
      missing: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"].filter(
        (name) => !process.env[name]?.trim()
      ),
    },
  });
}
