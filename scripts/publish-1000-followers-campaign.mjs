#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

if (process.env.CONFIRM_PUBLISH !== "YES") {
  throw new Error("Set CONFIRM_PUBLISH=YES to publish this campaign");
}

const graph = "https://graph.facebook.com/v23.0";
const campaignDir = path.join(process.cwd(), "public", "social", "1000-followers-bread-guide");
const resultPath = path.join(campaignDir, "published.json");

if (fs.existsSync(resultPath)) {
  throw new Error(`Campaign already has a publication record at ${resultPath}`);
}

const imageUrls = [
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/01-thank-you-1000.png",
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/02-why-bread-matters.png",
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/03-free-bread-guide.png",
  "https://www.vegan-masala.com/social/1000-followers-bread-guide/04-follow-and-visit.png",
];

const instagramToken = String(process.env.META_ACCESS_TOKEN || "").trim();
const instagramUserId = String(process.env.META_IG_USER_ID || process.env.INSTAGRAM_BUSINESS_ID || "").trim();
const facebookToken = String(process.env.META_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || "").trim();
const facebookPageId = String(process.env.META_PAGE_ID || "").trim();

if (!instagramToken || !instagramUserId || !facebookToken || !facebookPageId) {
  throw new Error("Required Instagram or Facebook publishing configuration is missing");
}

const baseCaption = fs.readFileSync(path.join(campaignDir, "caption.txt"), "utf8").trim();
const facebookCaption = `${baseCaption}\n\nGet the guide: https://www.vegan-masala.com/bread-guide?utm_source=facebook&utm_medium=organic_social&utm_campaign=1000_followers_bread_guide&utm_content=carousel`;

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Meta request failed (${response.status})`);
  }
  return payload;
}

async function postForm(endpoint, body) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) form.set(key, String(value));
  return jsonRequest(`${graph}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
}

async function waitForContainer(id, token) {
  const started = Date.now();
  while (Date.now() - started < 90_000) {
    const url = new URL(`${graph}/${id}`);
    url.searchParams.set("fields", "status_code,status");
    url.searchParams.set("access_token", token);
    const payload = await jsonRequest(url);
    const status = String(payload.status_code || payload.status || "").toUpperCase();
    if (status === "FINISHED" || status === "PUBLISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Instagram container ${id} failed with ${status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Instagram container ${id} timed out`);
}

async function verifyPublicAssets() {
  for (const url of imageUrls) {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) throw new Error(`Campaign image is not publicly available: ${url}`);
  }
}

async function findExistingInstagramPost() {
  const url = new URL(`${graph}/${instagramUserId}/media`);
  url.searchParams.set("fields", "id,caption,permalink,timestamp");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", instagramToken);
  const payload = await jsonRequest(url);
  const match = (payload.data || []).find((item) =>
    String(item.caption || "").includes("1,000 followers!")
  );
  return match ? { id: match.id, permalink: match.permalink || null, existing: true } : null;
}

async function findExistingFacebookPost() {
  const pageToken = await resolveFacebookPageToken();
  const url = new URL(`${graph}/${facebookPageId}/posts`);
  url.searchParams.set("fields", "id,message,permalink_url,created_time");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", pageToken);
  const payload = await jsonRequest(url);
  const match = (payload.data || []).find((item) =>
    String(item.message || "").includes("1,000 followers!")
  );
  return match ? { id: match.id, permalink: match.permalink_url || null, existing: true } : null;
}

async function publishInstagramCarousel() {
  const childIds = [];
  for (const imageUrl of imageUrls) {
    const child = await postForm(`/${instagramUserId}/media`, {
      image_url: imageUrl,
      is_carousel_item: "true",
      access_token: instagramToken,
    });
    if (!child.id) throw new Error("Instagram did not return a carousel child ID");
    await waitForContainer(child.id, instagramToken);
    childIds.push(child.id);
  }

  const parent = await postForm(`/${instagramUserId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption: baseCaption,
    access_token: instagramToken,
  });
  if (!parent.id) throw new Error("Instagram did not return a carousel container ID");
  await waitForContainer(parent.id, instagramToken);

  const published = await postForm(`/${instagramUserId}/media_publish`, {
    creation_id: parent.id,
    access_token: instagramToken,
  });
  const detailsUrl = new URL(`${graph}/${published.id}`);
  detailsUrl.searchParams.set("fields", "permalink");
  detailsUrl.searchParams.set("access_token", instagramToken);
  const details = await jsonRequest(detailsUrl);
  return { id: published.id, permalink: details.permalink || null, childIds };
}

async function resolveFacebookPageToken() {
  const url = new URL(`${graph}/${facebookPageId}`);
  url.searchParams.set("fields", "access_token");
  url.searchParams.set("access_token", facebookToken);
  const payload = await jsonRequest(url);
  return String(payload.access_token || facebookToken);
}

async function publishFacebookCarousel() {
  const pageToken = await resolveFacebookPageToken();
  const photoIds = [];

  for (const imageUrl of imageUrls) {
    const photo = await postForm(`/${facebookPageId}/photos`, {
      url: imageUrl,
      published: "false",
      access_token: pageToken,
    });
    if (!photo.id) throw new Error("Facebook did not return an unpublished photo ID");
    photoIds.push(photo.id);
  }

  const body = {
    message: facebookCaption,
    access_token: pageToken,
  };
  photoIds.forEach((id, index) => {
    body[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
  });
  const published = await postForm(`/${facebookPageId}/feed`, body);
  if (!published.id) throw new Error("Facebook did not return a post ID");

  const detailsUrl = new URL(`${graph}/${published.id}`);
  detailsUrl.searchParams.set("fields", "permalink_url");
  detailsUrl.searchParams.set("access_token", pageToken);
  const details = await jsonRequest(detailsUrl);
  return { id: published.id, permalink: details.permalink_url || null, photoIds };
}

await verifyPublicAssets();
const instagram = (await findExistingInstagramPost()) || await publishInstagramCarousel();
const facebook = (await findExistingFacebookPost()) || await publishFacebookCarousel();
const record = {
  publishedAt: new Date().toISOString(),
  instagram,
  facebook,
  campaign: "1000_followers_bread_guide",
};
fs.writeFileSync(resultPath, `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify(record, null, 2));
