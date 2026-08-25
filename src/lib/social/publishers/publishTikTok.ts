import { getTikTokAccessToken } from "../core/tiktokAuth";
import { loadSocialToken } from "../core/socialTokenStore";

type PublishTikTokInput = {
  caption: string;
  videoUrl: string;
};

const API_BASE = "https://open.tiktokapis.com";

export async function tikTokPublishingConfigured() {
  const stored = await loadSocialToken("tiktok");
  return Boolean(
    (stored?.refresh_token || process.env.TIKTOK_REFRESH_TOKEN?.trim() || process.env.TIKTOK_ACCESS_TOKEN?.trim()) &&
      process.env.TIKTOK_CLIENT_KEY?.trim() &&
      process.env.TIKTOK_CLIENT_SECRET?.trim() &&
      process.env.TIKTOK_DIRECT_POST_ENABLED?.trim().toLowerCase() === "true"
  );
}

async function tiktokPost(path: string, token: string, body?: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error?.code !== "ok") {
    throw new Error(
      `TikTok API publish failed: ${data?.error?.message || data?.error?.code || response.status}`
    );
  }
  return data;
}

export async function publishTikTok(input: PublishTikTokInput) {
  if (!(await tikTokPublishingConfigured())) {
    throw new Error(
      "TikTok Direct Post is not enabled; connect an approved video.publish app first"
    );
  }

  const token = await getTikTokAccessToken();
  if (!token) throw new Error("TikTok is not connected");

  const creator = await tiktokPost("/v2/post/publish/creator_info/query/", token);
  const privacyOptions: string[] = creator?.data?.privacy_level_options || [];
  const requestedPrivacy = process.env.TIKTOK_PRIVACY_LEVEL?.trim() || "SELF_ONLY";
  const privacyLevel = privacyOptions.includes(requestedPrivacy)
    ? requestedPrivacy
    : privacyOptions.includes("SELF_ONLY")
      ? "SELF_ONLY"
      : privacyOptions[0];

  if (!privacyLevel) {
    throw new Error("TikTok creator information returned no allowed privacy level");
  }

  const videoResponse = await fetch(input.videoUrl, { cache: "no-store" });
  if (!videoResponse.ok) {
    throw new Error(`TikTok video download failed: ${videoResponse.status}`);
  }
  const video = Buffer.from(await videoResponse.arrayBuffer());
  if (!video.length) throw new Error("TikTok video download was empty");

  const result = await tiktokPost("/v2/post/publish/video/init/", token, {
    post_info: {
      title: input.caption.slice(0, 2200),
      privacy_level: privacyLevel,
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      brand_content_toggle: false,
      brand_organic_toggle: true,
      is_aigc: process.env.TIKTOK_MARK_AIGC?.trim().toLowerCase() === "true",
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: video.length,
      chunk_size: video.length,
      total_chunk_count: 1,
    },
  });

  const uploadUrl = String(result?.data?.upload_url || "");
  if (!uploadUrl) throw new Error("TikTok upload URL missing from publish response");

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": videoResponse.headers.get("content-type") || "video/mp4",
      "Content-Length": String(video.length),
      "Content-Range": `bytes 0-${video.length - 1}/${video.length}`,
    },
    body: video,
  });
  if (!upload.ok) {
    const detail = await upload.text().catch(() => "");
    throw new Error(`TikTok video upload failed: ${upload.status}${detail ? ` ${detail}` : ""}`);
  }

  return {
    id: result?.data?.publish_id || null,
    privacyLevel,
  };
}
