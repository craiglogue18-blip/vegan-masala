import { Readable } from "node:stream";
import { google } from "googleapis";

type PublishYouTubeInput = {
  title: string;
  description: string;
  videoUrl: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing; YouTube is not connected`);
  return value;
}

export function youtubePublishingConfigured() {
  return Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
      process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
      process.env.YOUTUBE_REFRESH_TOKEN?.trim()
  );
}

export async function publishYouTube(input: PublishYouTubeInput) {
  const clientId = required("YOUTUBE_CLIENT_ID");
  const clientSecret = required("YOUTUBE_CLIENT_SECRET");
  const refreshToken = required("YOUTUBE_REFRESH_TOKEN");

  const response = await fetch(input.videoUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`YouTube video download failed: ${response.status}`);
  }

  const oauth = new google.auth.OAuth2(clientId, clientSecret);
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
