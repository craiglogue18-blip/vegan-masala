import { Readable } from "node:stream";
import { google } from "googleapis";
import { youtubeOauthClient, youtubeRefreshToken } from "../core/youtubeAuth";

type PublishYouTubeInput = {
  title: string;
  description: string;
  videoUrl: string;
};

export async function youtubePublishingConfigured() {
  if (!process.env.YOUTUBE_CLIENT_ID?.trim() || !process.env.YOUTUBE_CLIENT_SECRET?.trim()) {
    return false;
  }
  return Boolean(await youtubeRefreshToken());
}

export async function publishYouTube(input: PublishYouTubeInput) {
  const refreshToken = await youtubeRefreshToken();
  if (!refreshToken) throw new Error("YouTube is not connected");

  const response = await fetch(input.videoUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`YouTube video download failed: ${response.status}`);
  }

  const oauth = youtubeOauthClient();
  oauth.setCredentials({ refresh_token: refreshToken });
  const youtube = google.youtube({ version: "v3", auth: oauth });
  const privacyStatus = process.env.YOUTUBE_PRIVACY_STATUS?.trim() || "private";

  const result = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: `${input.title} | Vegan Masala`.slice(0, 100),
        description: input.description,
        categoryId: "26",
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: response.headers.get("content-type") || "video/mp4",
      body: Readable.from(Buffer.from(await response.arrayBuffer())),
    },
  });

  return { id: result.data.id || null, privacyStatus };
}
