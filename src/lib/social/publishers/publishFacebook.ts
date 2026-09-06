const GRAPH_BASE = "https://graph.facebook.com/v23.0";

import { assertSocialPublishPreflight } from "@/lib/social/core/publishPreflight";
import { resolveFacebookMetaAuth } from "@/lib/social/publishers/metaCore";

type PublishFacebookInput = {
  slug: string;
  caption: string;
  assetType: "image" | "video";
  imageUrl?: string;
  videoUrl?: string;
};

type MetaPostResponse = {
  id?: string;
  post_id?: string;
  [key: string]: unknown;
};

function getSiteBase() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.vegan-masala.com"
  ).replace(/\/+$/, "");
}

async function metaPostForm(
  endpoint: string,
  body: Record<string, string>,
  accessToken: string
): Promise<MetaPostResponse> {
  const form = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    form.set(key, value);
  });
  form.set("access_token", accessToken);

  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const metaMessage =
      data?.error?.message ||
      data?.message ||
      `Meta POST failed for ${endpoint}`;

    throw new Error(metaMessage);
  }

  return data;
}

async function resolvePageAccessToken(pageId: string, accessToken: string) {
  const url = new URL(`${GRAPH_BASE}/${pageId}`);
  url.searchParams.set("fields", "access_token");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const pageAccessToken = String(data?.access_token || "").trim();

  if (!res.ok || !pageAccessToken) {
    const metaMessage =
      data?.error?.message ||
      "Facebook did not return a Page access token for the configured Page";
    throw new Error(metaMessage);
  }

  return pageAccessToken;
}

async function resolvePublishedUrl(id: string | null | undefined, accessToken: string) {
  if (!id) return null;
  const url = new URL(`${GRAPH_BASE}/${id}`);
  url.searchParams.set("fields", "permalink_url");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return res.ok && typeof data?.permalink_url === "string" ? data.permalink_url : null;
}

export async function publishFacebook(input: PublishFacebookInput) {
  const slug = input.slug.trim();

  if (!slug) {
    throw new Error("Facebook publish slug missing");
  }

  const preflight = assertSocialPublishPreflight({
    platform: "facebook",
    slug,
    stage: "publish",
    assetType: input.assetType,
    imageUrl: input.imageUrl,
    publishImageUrl: input.imageUrl,
    videoUrl: input.videoUrl,
    baseUrl: getSiteBase(),
  });

  const { accessToken, pageId } = resolveFacebookMetaAuth();
  // A System User token carries the granted scopes, but Page publishing
  // endpoints require the Page token derived from that identity.
  const pageAccessToken = await resolvePageAccessToken(pageId, accessToken);

  if (input.assetType === "video") {
    const safeVideoUrl = preflight.normalized.videoUrl || input.videoUrl || "";

    if (!safeVideoUrl) {
      throw new Error("Facebook video URL missing");
    }

    const published = await metaPostForm(`/${pageId}/videos`, {
      file_url: safeVideoUrl,
      description: input.caption || "",
      published: "true",
    }, pageAccessToken);
    const publishedUrl = await resolvePublishedUrl(published?.id, pageAccessToken);

    return {
      ok: true,
      assetType: "video" as const,
      pageId,
      videoUrl: safeVideoUrl,
      videoId: published?.id || null,
      published,
      publishedUrl,
    };
  }

  const safeImageUrl =
    preflight.normalized.publishImageUrl ||
    preflight.normalized.imageUrl ||
    input.imageUrl ||
    "";

  if (!safeImageUrl) {
    throw new Error("Facebook image URL missing");
  }

  const published = await metaPostForm(`/${pageId}/photos`, {
    url: safeImageUrl,
    caption: input.caption || "",
    published: "true",
  }, pageAccessToken);
  const publishedUrl = await resolvePublishedUrl(
    published?.post_id || published?.id,
    pageAccessToken
  );

  return {
    ok: true,
    assetType: "image" as const,
    pageId,
    imageUrl: safeImageUrl,
    photoId: published?.id || null,
    postId: published?.post_id || null,
    published,
    publishedUrl,
  };
}
