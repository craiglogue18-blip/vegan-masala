#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
const username = String(process.env.ADMIN_USERNAME || "vegan-masala").trim();
const password = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "").trim();
const campaign = JSON.parse(fs.readFileSync("public/social/brand-promo-v6/campaign.json", "utf8"));
const title = campaign.title;
const videoUrl = "https://raw.githubusercontent.com/craiglogue18-blip/vegan-masala/main/public/social/brand-promo-v6/vegan-masala-promo-v6-review.mp4";
const coverUrl = `${site}/social/brand-promo-v6/cover.jpg`;
const targets = ["instagram", "facebook", "youtube"];

if (!password) throw new Error("Admin password or token is required");

const headers = {
  Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  "Content-Type": "application/json",
};

async function request(endpoint, options = {}) {
  const response = await fetch(`${site}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `${endpoint} failed (${response.status})`);
  return data;
}

const queue = await request("/api/admin/social/queue", { method: "GET" });
const existing = Array.isArray(queue.items) ? queue.items : [];
const results = [];

for (const platform of targets) {
  for (const item of existing.filter((candidate) =>
    candidate.title === title && candidate.platform === platform && candidate.status === "queued"
  )) {
    await request("/api/admin/social/queue", {
      method: "DELETE",
      body: JSON.stringify({ id: item.id }),
    });
  }

  const created = await request("/api/admin/social/queue", {
    method: "POST",
    body: JSON.stringify({
      slug: "herbs",
      title,
      platform,
      caption: campaign.caption,
      url: campaign.url,
      scheduledFor: new Date().toISOString(),
      assetType: "video",
      imageUrl: coverUrl,
      publishImageUrl: coverUrl,
      videoUrl,
      requiresApproval: false,
    }),
  });

  try {
    const published = await request("/api/admin/social/queue/run-now", {
      method: "POST",
      headers: { Origin: site },
      body: JSON.stringify({ itemId: created.item.id }),
    });
    results.push({ platform, id: created.item.id, published });
  } catch (error) {
    results.push({ platform, id: created.item.id, error: String(error?.message || error) });
  }
}

console.log(JSON.stringify({ ok: true, videoUrl, results }, null, 2));
