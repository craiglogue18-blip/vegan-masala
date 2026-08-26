#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ path: process.env.VEGAN_MASALA_ENV_FILE || ".env.local" });

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const token = process.env.RECRAFT_API_TOKEN?.trim();
const model = process.env.RECRAFT_MODEL?.trim() || "recraftv4";
if (!token) throw new Error("RECRAFT_API_TOKEN is missing");

const outputDir = path.join(process.cwd(), "public", "images", "home", "collections");
fs.mkdirSync(outputDir, { recursive: true });

const shared = "Premium realistic editorial Indian food photography for the Vegan Masala website, dark navy-black stone table, restrained antique-gold accents, warm directional restaurant lighting, authentic appetising texture, elegant overhead three-quarter composition, consistent visual series, no people, no text, no logos, no watermark, not cartoonish, not glossy artificial food.";
const jobs = [
  ["quick-meals", "A vibrant vegan chickpea and spinach curry in a dark ceramic bowl, small bowls of cumin and turmeric nearby, weeknight meal feeling."],
  ["one-pot", "A generous one-pot vegan Indian coconut vegetable curry in a deep brass-toned cooking pot, serving spoon, gentle steam."],
  ["dal-lentils", "Creamy golden tarka dal finished with cumin, chilli and coriander in a handcrafted dark bowl, visible aromatic tempering."],
  ["curries", "A rich deep-red vegan Indian curry with tomato masala, coriander and a subtle coconut swirl, dramatic but natural presentation."],
  ["snacks", "Crisp golden onion bhajis, vegetable pakoras and samosas arranged for sharing with green and tamarind chutneys."],
];

for (const [name, subject] of jobs) {
  const response = await fetch("https://external.api.recraft.ai/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ model, prompt: `${shared} Subject: ${subject}` }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${name}: ${JSON.stringify(result)}`);
  const url = result?.data?.[0]?.url || result?.image?.url;
  if (!url) throw new Error(`${name}: Recraft returned no image URL`);
  const imageResponse = await fetch(url);
  if (!imageResponse.ok) throw new Error(`${name}: image download failed`);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const output = path.join(outputDir, `${name}.webp`);
  await sharp(buffer).resize(1200, 800, { fit: "cover", position: "centre" }).webp({ quality: 88 }).toFile(output);
  console.log(output);
}
