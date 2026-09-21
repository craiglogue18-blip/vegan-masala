#!/usr/bin/env node

import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
const username = String(process.env.ADMIN_USERNAME || "vegan-masala").trim();
const password = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "").trim();
const campaignTitle = "Authentic vegan Indian food, made practical";

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
const items = (Array.isArray(queue.items) ? queue.items : []).filter(
  (item) => item.title === campaignTitle && item.status === "queued"
);

if (!items.length) throw new Error("No queued brand-promo entries were found");

const results = [];
for (const item of items) {
  await request("/api/admin/social/queue", {
    method: "PATCH",
    body: JSON.stringify({ id: item.id, action: "approve" }),
  });
  await request("/api/admin/social/queue", {
    method: "PATCH",
    body: JSON.stringify({ id: item.id, action: "post-now" }),
  });

  try {
    const result = await request("/api/admin/social/queue/run-now", {
      method: "POST",
      headers: { Origin: site },
      body: JSON.stringify({
        itemId: item.id,
        confirmTikTok: item.platform === "tiktok",
      }),
    });
    results.push({ id: item.id, platform: item.platform, ok: true, result });
  } catch (error) {
    results.push({ id: item.id, platform: item.platform, ok: false, error: String(error?.message || error) });
  }
}

console.log(JSON.stringify({ ok: results.every((item) => item.ok), results }, null, 2));
