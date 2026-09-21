import { getTikTokAccessToken } from "../core/tiktokAuth";
import { loadSocialToken } from "../core/socialTokenStore";

type PublishTikTokInput = {
  caption: string;
  videoUrl: string;
  queueItemId: string;
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTikTokPost(token: string, publishId: string) {
  let latest: any = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) await wait(5_000);
    const result = await tiktokPost("/v2/post/publish/status/fetch/", token, {
      publish_id: publishId,
    });
    latest = result?.data || null;
    const status = String(latest?.status || "");

    if (status === "FAILED") {
      throw new Error(`TikTok publish failed: ${latest?.fail_reason || "unknown reason"}`);
    }

    if (status === "PUBLISH_COMPLETE") return latest;
  }

  return latest;
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
  const requestedPrivacy = process.env.TIKTOK_PRIVACY_LEVEL?.trim() || "PUBLIC_TO_EVERYONE";
  const privacyLevel = privacyOptions.includes(requestedPrivacy)
    ? requestedPrivacy
    : "";

  if (!privacyLevel) {
    throw new Error(
      `TikTok cannot publish with ${requestedPrivacy}. Available visibility options: ${privacyOptions.join(", ") || "none"}`
    );
  }

  const verifiedMediaBase = (
    process.env.TIKTOK_VERIFIED_MEDIA_BASE_URL || "https://www.vegan-masala.com"
  ).replace(/\/+$/, "");
  const verifiedOrigin = new URL(verifiedMediaBase);
  if (verifiedOrigin.protocol !== "https:" || verifiedOrigin.pathname !== "/") {
    throw new Error("TIKTOK_VERIFIED_MEDIA_BASE_URL must be an HTTPS origin");
  }
  const verifiedVideoUrl = `${verifiedMediaBase}/api/tiktok/media/${encodeURIComponent(input.queueItemId)}`;

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
      source: "PULL_FROM_URL",
      video_url: verifiedVideoUrl,
    },
  });

  const publishId = String(result?.data?.publish_id || "");
  const status = publishId ? await waitForTikTokPost(token, publishId) : null;
  const postId = Array.isArray(status?.publicaly_available_post_id)
    ? String(status.publicaly_available_post_id[0] || "")
    : "";
  const creatorUsername = String(creator?.data?.creator_username || "").replace(/^@/, "");

  return {
    id: postId || publishId || null,
    publishId: publishId || null,
    postId: postId || null,
    processingStatus: status?.status || "PROCESSING",
    privacyLevel,
    videoUrl: verifiedVideoUrl,
    publishedUrl:
      postId && creatorUsername
        ? `https://www.tiktok.com/@${encodeURIComponent(creatorUsername)}/video/${encodeURIComponent(postId)}`
        : null,
  };
}
