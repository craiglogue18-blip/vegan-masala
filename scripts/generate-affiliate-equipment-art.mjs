#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ path: process.env.VEGAN_MASALA_ENV_FILE || ".env.local" });

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const token = process.env.RECRAFT_API_TOKEN?.trim();
const model = process.env.RECRAFT_MODEL?.trim() || "recraftv4";
if (!token) throw new Error("RECRAFT_API_TOKEN is missing");

const outputDir = path.join(process.cwd(), "public", "images", "affiliate", "equipment");
fs.mkdirSync(outputDir, { recursive: true });

const shared = "Original premium editorial product-style photography for the Vegan Masala website. A single unbranded Indian cooking tool, photographed in a real home kitchen setting on dark navy-black stone with restrained antique-gold details, warm natural side lighting, authentic materials and subtle Indian spices used only where relevant. Clean square composition, the tool fully visible and clearly identifiable, consistent visual series. No people, no prepared meal, no packaging, no brand marks, no text, no logos, no watermark, no duplicated objects, not a copy of any commercial product listing, not glossy CGI.";

const jobs = [
  ["pressure-cooker", "A modern stainless-steel stovetop pressure cooker, lid secured, with a small bowl of dry chickpeas beside it."],
  ["tawa", "A seasoned round cast-iron tawa with a low rim and wooden handle, resting empty beside a small rolling pin."],
  ["hand-blender", "An unbranded stainless-steel immersion hand blender standing beside a deep blending jug containing a little smooth tomato curry base."],
  ["spice-grinder", "A compact unbranded electric spice grinder with its open cup showing freshly ground cumin and coriander, a few whole spices nearby."],
  ["kadai", "A deep black iron kadai with two loop handles, empty and clean, with a wooden cooking spoon alongside."],
  ["heavy-pot", "A heavy dark enamelled casserole pot with a thick base and lid placed slightly to one side, empty and clean."],
  ["sieve", "A fine-mesh stainless-steel kitchen sieve holding rinsed basmati rice above a dark ceramic bowl, droplets visible."],
  ["idli-steamer", "An open stainless-steel idli steamer with stacked round plates and clearly visible shaped idli moulds, empty and clean."],
  ["mini-chopper", "A compact unbranded mini food chopper with a clear bowl containing roughly chopped ginger, garlic and chilli."],
  ["rice-cooker", "A compact unbranded electric rice cooker with its lid open to reveal fluffy basmati rice, a wooden rice paddle alongside."],
  ["tadka-pan", "A small black iron tadka tempering pan with a long handle, holding a small amount of cumin seeds and dried chilli in shimmering oil."],
  ["spice-box", "An open round stainless-steel masala dabba with seven neat inner cups containing turmeric, cumin, coriander, chilli, mustard seeds, garam masala and cardamom."],
  ["spice-jars", "A tidy set of six small airtight glass spice jars with plain unlabelled wooden lids, filled with visibly different whole and ground Indian spices."],
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
  await sharp(buffer).resize(720, 720, { fit: "cover", position: "centre" }).webp({ quality: 86 }).toFile(output);
  console.log(output);
}
