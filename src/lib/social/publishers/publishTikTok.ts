type PublishTikTokInput = {
  caption: string;
  videoUrl: string;
};

const API_BASE = "https://open.tiktokapis.com";

function accessToken() {
  const token = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("TIKTOK_ACCESS_TOKEN missing; TikTok is not connected");
  return token;
}

export function tikTokPublishingConfigured() {
  return Boolean(
    process.env.TIKTOK_ACCESS_TOKEN?.trim() &&
      process.env.TIKTOK_DIRECT_POST_ENABLED?.trim().toLowerCase() === "true"
  );
}

async function tiktokPost(path: string, body?: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
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
  if (!tikTokPublishingConfigured()) {
    throw new Error(
      "TikTok Direct Post is not enabled; connect an approved video.publish app first"
    );
  }

  const creator = await tiktokPost("/v2/post/publish/creator_info/query/");
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

  const result = await tiktokPost("/v2/post/publish/video/init/", {
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
      source: "PULL_FROM_URL",
      video_url: input.videoUrl,
    },
  });

  return {
    id: result?.data?.publish_id || null,
    privacyLevel,
  };
}
