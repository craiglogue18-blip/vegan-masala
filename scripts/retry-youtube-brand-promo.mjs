#!/usr/bin/env node

import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
const username = String(process.env.ADMIN_USERNAME || "vegan-masala").trim();
const password = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "").trim();
const title = "Authentic vegan Indian food, made practical";

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
const item = (Array.isArray(queue.items) ? queue.items : []).find(
  (candidate) => candidate.title === title && candidate.platform === "youtube" && candidate.status === "failed"
);

if (!item) throw new Error("The failed YouTube brand-promo item was not found");

await request("/api/admin/social/queue", {
  method: "PATCH",
  body: JSON.stringify({ id: item.id, action: "retry" }),
});
await request("/api/admin/social/queue", {
  method: "PATCH",
  body: JSON.stringify({ id: item.id, action: "post-now" }),
});

const result = await request("/api/admin/social/queue/run-now", {
  method: "POST",
  headers: { Origin: site },
  body: JSON.stringify({ itemId: item.id }),
});

console.log(JSON.stringify({ ok: true, id: item.id, result }, null, 2));
