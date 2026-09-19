import { NextResponse } from "next/server";

import { getMetaConfig } from "@/lib/social/publishers/metaCore";

export const maxDuration = 300;

const GRAPH = "https://graph.facebook.com/v23.0";
const MARKER = "1,000 followers!";
const IMAGE_URLS = [
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/01-thank-you-1000.png",
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/02-why-bread-matters.png",
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/03-free-bread-guide.png",
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/04-follow-and-visit.png",
];

const CAPTION = `1,000 followers! 🌿

Thank you to every person who has followed, cooked, saved, shared, commented or simply stopped by for a little Vegan Masala inspiration. Reaching 1,000 followers means far more than a number to us: it means a growing community of people who care about generous, practical and authentic vegan Indian cooking.

Every recipe you have tried, every question you have asked and every post you have passed on has helped this small kitchen grow. We are genuinely grateful that you have chosen to cook with us.

To celebrate, we have created a new free illustrated guide: Authentic Indian Vegan Breads.

Inside you will find:
• roti, naan, poori and regional breads
• traditional tandoor and everyday tawa techniques
• advice on flour, shaping, heat and troubleshooting
• the cultural place of bread at the Indian table
• carefully chosen ingredient and equipment recommendations

Get your free copy through the link in our bio or visit vegan-masala.com/bread-guide. The signup is free, and you will also unlock our seven-day vegan Indian dinner plan.

Not following yet? Follow @veganmasalaonline for recipes, techniques and new guides—and find Vegan Masala on Facebook too.

Know someone who would enjoy learning to make Indian bread? Please share this post with them. ❤️

Affiliate disclosure: some equipment and ingredient links in the guide are affiliate links. If you choose to buy through one, Vegan Masala may earn a small commission at no extra cost to you. Recommendations are included because they are relevant and useful.

#VeganMasala #IndianBread #VeganIndianFood #Roti #Chapati #Naan #IndianCooking #VeganRecipes #PlantBasedRecipes #HomeCooking`;

type InstagramMediaItem = {
  id?: unknown;
  caption?: unknown;
  permalink?: unknown;
};

type FacebookPostItem = {
  id?: unknown;
  message?: unknown;
  permalink_url?: unknown;
};

async function jsonRequest(url: string | URL, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Meta request failed (${response.status})`);
  }
  return payload;
}

async function postForm(endpoint: string, body: Record<string, string>) {
  return jsonRequest(`${GRAPH}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
}

async function waitForContainer(id: string, token: string) {
  const started = Date.now();
  while (Date.now() - started < 90_000) {
    const url = new URL(`${GRAPH}/${id}`);
    url.searchParams.set("fields", "status_code,status");
    url.searchParams.set("access_token", token);
    const payload = await jsonRequest(url);
    const status = String(payload.status_code || payload.status || "").toUpperCase();
    if (status === "FINISHED" || status === "PUBLISHED") return;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram container failed with ${status}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("Instagram carousel processing timed out");
}

async function findInstagram(token: string, igUserId: string) {
  const url = new URL(`${GRAPH}/${igUserId}/media`);
  url.searchParams.set("fields", "id,caption,permalink,timestamp");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", token);
  const payload = await jsonRequest(url);
  return (payload.data || []).find((item: InstagramMediaItem) => String(item.caption || "").includes(MARKER)) || null;
}

async function publishInstagram(token: string, igUserId: string) {
  const existing = await findInstagram(token, igUserId);
  if (existing) return { id: existing.id, permalink: existing.permalink || null, existing: true };

  const children: string[] = [];
  for (const imageUrl of IMAGE_URLS) {
    const child = await postForm(`/${igUserId}/media`, {
      image_url: imageUrl,
      is_carousel_item: "true",
      access_token: token,
    });
    await waitForContainer(String(child.id), token);
    children.push(String(child.id));
  }
  const parent = await postForm(`/${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption: CAPTION,
    access_token: token,
  });
  await waitForContainer(String(parent.id), token);
  const published = await postForm(`/${igUserId}/media_publish`, {
    creation_id: String(parent.id),
    access_token: token,
  });
  const detailsUrl = new URL(`${GRAPH}/${published.id}`);
  detailsUrl.searchParams.set("fields", "permalink");
  detailsUrl.searchParams.set("access_token", token);
  const details = await jsonRequest(detailsUrl);
  return { id: published.id, permalink: details.permalink || null, existing: false };
}

async function resolvePageToken(accessToken: string, pageId: string) {
  const url = new URL(`${GRAPH}/${pageId}`);
  url.searchParams.set("fields", "access_token");
  url.searchParams.set("access_token", accessToken);
  const payload = await jsonRequest(url);
  return String(payload.access_token || accessToken);
}

async function findFacebook(token: string, pageId: string) {
  const url = new URL(`${GRAPH}/${pageId}/posts`);
  url.searchParams.set("fields", "id,message,permalink_url,created_time");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", token);
  const payload = await jsonRequest(url);
  return (payload.data || []).find((item: FacebookPostItem) => String(item.message || "").includes(MARKER)) || null;
}

async function publishFacebook(accessToken: string, pageId: string) {
  const token = await resolvePageToken(accessToken, pageId);
  const existing = await findFacebook(token, pageId);
  if (existing) return { id: existing.id, permalink: existing.permalink_url || null, existing: true };

  const photos: string[] = [];
  for (const imageUrl of IMAGE_URLS) {
    const photo = await postForm(`/${pageId}/photos`, {
      url: imageUrl,
      published: "false",
      access_token: token,
    });
    photos.push(String(photo.id));
  }
  const body: Record<string, string> = {
    message: `${CAPTION}\n\nGet the guide: https://www.vegan-masala.com/bread-guide?utm_source=facebook&utm_medium=organic_social&utm_campaign=1000_followers_bread_guide&utm_content=carousel`,
    access_token: token,
  };
  photos.forEach((id, index) => {
    body[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
  });
  const published = await postForm(`/${pageId}/feed`, body);
  const detailsUrl = new URL(`${GRAPH}/${published.id}`);
  detailsUrl.searchParams.set("fields", "permalink_url");
  detailsUrl.searchParams.set("access_token", token);
  const details = await jsonRequest(detailsUrl);
  return { id: published.id, permalink: details.permalink_url || null, existing: false };
}

export async function POST() {
  try {
    const config = getMetaConfig();
    if (!config.accessToken || !config.igUserId || !config.pageId) {
      return NextResponse.json({ ok: false, error: "Meta configuration is incomplete" }, { status: 500 });
    }
    const [instagram, facebook] = await Promise.all([
      publishInstagram(config.accessToken, config.igUserId),
      publishFacebook(config.pageAccessToken || config.accessToken, config.pageId),
    ]);
    return NextResponse.json({ ok: true, instagram, facebook });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Carousel publishing failed" },
      { status: 500 }
    );
  }
}
