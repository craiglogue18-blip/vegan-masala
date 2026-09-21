#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
const username = String(process.env.ADMIN_USERNAME || "vegan-masala").trim();
const password = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "").trim();
const campaign = JSON.parse(fs.readFileSync("public/social/brand-promo-v6/campaign.json", "utf8"));
const videoUrl = "https://raw.githubusercontent.com/craiglogue18-blip/vegan-masala/main/public/social/brand-promo-v6/vegan-masala-promo-v6-review.mp4";
const coverUrl = `${site}/social/brand-promo-v6/cover.jpg`;

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

const results = [];
for (const platform of ["youtube", "tiktok"]) {
  const created = await request("/api/admin/social/queue", {
    method: "POST",
    body: JSON.stringify({
      slug: "herbs",
      title: campaign.title,
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

  await request("/api/admin/social/queue", {
    method: "PATCH",
    body: JSON.stringify({ id: created.item.id, action: "approve" }),
  });
  await request("/api/admin/social/queue", {
    method: "PATCH",
    body: JSON.stringify({ id: created.item.id, action: "post-now" }),
  });

  const published = await request("/api/admin/social/queue/run-now", {
    method: "POST",
    headers: { Origin: site },
    body: JSON.stringify({
      itemId: created.item.id,
      confirmTikTok: platform === "tiktok",
    }),
  });
  results.push({ platform, id: created.item.id, published });
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
