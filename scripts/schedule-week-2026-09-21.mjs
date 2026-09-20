#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
const campaignPath = path.join(process.cwd(), "public", "social", "week-2026-09-21", "campaign.json");
const campaign = JSON.parse(fs.readFileSync(campaignPath, "utf8"));
const username = String(process.env.ADMIN_USERNAME || "vegan-masala").trim();
const password = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "").trim();

if (!password) throw new Error("ADMIN_PASSWORD or ADMIN_TOKEN is required");

const headers = {
  Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  "Content-Type": "application/json",
};

const content = {
  "monday-roti": { slug: "chapati-recipe", title: "The moment a roti puffs" },
  "tuesday-balti": { slug: "vegetable-balti", title: "Do not rush the onions" },
  "wednesday-herbs": { slug: "herbs", title: "Fresh or dried herbs?" },
  "thursday-aloo-matar": { slug: "aloo-muttar", title: "Potatoes first. Peas later." },
  "friday-bread-tools": { slug: "vegan-indian-pantry-staples", title: "Three useful bread tools" },
  "saturday-jackfruit": { slug: "the-best-jackfruit-curry", title: "Make jackfruit hold the masala" },
  "sunday-dinner": { slug: "beginner-friendly-vegan-indian-recipes", title: "Dinner sorted for the week" },
};

function publicUrl(file) {
  return `${site}/social/week-2026-09-21/${file}`;
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${site}${endpoint}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `${endpoint} failed (${response.status})`);
  return data;
}

const queue = await request("/api/admin/social/queue", { method: "GET" });
const boardResponse = await request("/api/pinterest/boards", { method: "GET" });
const existing = Array.isArray(queue.items) ? queue.items : [];
const boards = Array.isArray(boardResponse.items) ? boardResponse.items : [];
const guideBoard = boards.find((item) => item.name === "Indian cooking guides")?.id;
const recipeBoard = boards.find((item) => item.name === "Vegan Indian Recipes")?.id;
if (!guideBoard || !recipeBoard) throw new Error("Required Pinterest boards were not found");
const results = [];

for (const item of campaign.schedule) {
  const details = content[item.id];
  if (!details) throw new Error(`No content mapping for ${item.id}`);
  const assets = item.type === "carousel" ? item.assets.map(publicUrl) : [];
  const imageUrl = item.type === "carousel" ? assets[0] : publicUrl(item.cover);
  const videoUrl = item.type === "video" ? publicUrl(item.asset) : "";

  for (const platform of item.platforms) {
    const duplicate = existing.find((queued) =>
      queued.title === details.title &&
      queued.platform === platform &&
      String(queued.scheduledFor || "").slice(0, 10) === String(item.schedule).slice(0, 10) &&
      queued.status === "queued"
    );
    if (duplicate) {
      results.push({ id: duplicate.id, platform, title: details.title, status: "already-scheduled" });
      continue;
    }

    const body = {
      slug: details.slug,
      title: details.title,
      platform,
      caption: item.caption,
      url: item.url,
      scheduledFor: item.schedule,
      board: platform === "pinterest" ? (item.id === "sunday-dinner" ? recipeBoard : guideBoard) : null,
      assetType: item.type === "video" ? "video" : "image",
      imageUrl,
      publishImageUrl: imageUrl,
      videoUrl,
      carouselImageUrls: platform === "instagram" || platform === "facebook" ? assets : [],
      requiresApproval: false,
    };

    const created = await request("/api/admin/social/queue", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (platform === "tiktok" && created?.item?.requiresApproval) {
      await request("/api/admin/social/queue", {
        method: "PATCH",
        body: JSON.stringify({ id: created.item.id, action: "approve" }),
      });
    }
    results.push({ id: created?.item?.id, platform, title: details.title, status: "scheduled" });
  }
}

console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
