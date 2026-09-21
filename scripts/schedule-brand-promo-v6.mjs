#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const root = process.cwd();
const campaignDir = path.join(root, "public", "social", "brand-promo-v6");
const campaignPath = path.join(campaignDir, "campaign.json");
const campaign = JSON.parse(fs.readFileSync(campaignPath, "utf8"));
const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
const username = String(process.env.ADMIN_USERNAME || "vegan-masala").trim();
const password = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "").trim();

if (!password) throw new Error("Admin password or token is required");

const authHeaders = {
  Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  "Content-Type": "application/json",
};

async function request(endpoint, options = {}) {
  const response = await fetch(`${site}${endpoint}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `${endpoint} failed (${response.status})`);
  return data;
}

const videoUrl = `${site}/social/brand-promo-v6/${campaign.video}`;
const coverUrl = `${site}/social/brand-promo-v6/${campaign.cover}`;

const queue = await request("/api/admin/social/queue", { method: "GET" });
const existing = Array.isArray(queue.items) ? queue.items : [];
const boardResponse = await request("/api/pinterest/boards", { method: "GET" });
const boards = Array.isArray(boardResponse.items) ? boardResponse.items : [];
const pinterestBoard = boards.find((item) => item.name === "Vegan Indian Recipes")?.id || boards[0]?.id;
const results = [];

for (const entry of campaign.schedule) {
  const duplicate = existing.find((item) =>
    item.title === campaign.title &&
    item.platform === entry.platform &&
    item.status === "queued"
  );
  if (duplicate) {
    results.push({ id: duplicate.id, platform: entry.platform, status: "already-queued" });
    continue;
  }

  const isPinterest = entry.platform === "pinterest";
  if (isPinterest && !pinterestBoard) throw new Error("No Pinterest board was found");

  const body = {
    slug: "herbs",
    title: campaign.title,
    platform: entry.platform,
    caption: isPinterest ? campaign.pinterestCaption : campaign.caption,
    url: campaign.url,
    scheduledFor: entry.scheduledFor,
    board: isPinterest ? pinterestBoard : null,
    assetType: isPinterest ? "image" : "video",
    imageUrl: coverUrl,
    publishImageUrl: coverUrl,
    videoUrl: isPinterest ? "" : videoUrl,
    requiresApproval: true
  };

  const created = await request("/api/admin/social/queue", {
    method: "POST",
    body: JSON.stringify(body),
  });
  results.push({ id: created?.item?.id, platform: entry.platform, status: "queued-for-review" });
}

campaign.status = "queued-for-review";
campaign.publishAllowed = false;
campaign.videoUrl = videoUrl;
campaign.coverUrl = coverUrl;
campaign.queueResults = results;
fs.writeFileSync(campaignPath, `${JSON.stringify(campaign, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ ok: true, videoUrl, coverUrl, results }, null, 2));
