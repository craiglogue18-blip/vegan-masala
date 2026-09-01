#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ path: process.env.VEGAN_MASALA_ENV_FILE || ".env.local", quiet: true });

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const token = process.env.RECRAFT_API_TOKEN?.trim();
const model = process.env.RECRAFT_MODEL?.trim() || "recraftv4";
if (!token) throw new Error("RECRAFT_API_TOKEN is missing");

const shared = "Premium realistic editorial food photography for the Vegan Masala website. Fresh natural produce on a dark navy-black stone surface, restrained antique-gold accents, warm directional window light, authentic textures, elegant overhead three-quarter composition, generous negative space, consistent visual series. No people, no text, no logos, no packaging, no watermark, not cartoonish, not glossy artificial food.";

const jobs = [
  ["seasonal-vegetables-for-indian-cooking", "winter-roots", "A seasonal winter arrangement of cauliflower, savoy cabbage, carrots, parsnips, potatoes and dark leafy greens, with tiny bowls of cumin and turmeric."],
  ["seasonal-vegetables-for-indian-cooking", "spring-greens", "A focused spring ingredient arrangement containing only new potatoes, open pea pods, loose peas, spinach leaves, spring greens, chard and a small amount of coriander. New potatoes and peas are the visual focus. Absolutely no radishes, beetroot, turnips or unrelated vegetables."],
  ["seasonal-vegetables-for-indian-cooking", "summer-produce", "A colourful summer arrangement of ripe tomatoes, aubergines, courgettes, peppers, green beans, coriander and mint."],
  ["seasonal-vegetables-for-indian-cooking", "autumn-harvest", "An autumn harvest arrangement of pumpkin, squash, beetroot, mushrooms, leeks and apples, earthy and abundant."],
  ["low-waste-vegan-indian-kitchen", "use-first-produce", "View looking directly inside a real domestic refrigerator at one clearly visible use-first shelf. On that shelf are exactly: two slightly wrinkled ripe tomatoes in a small tray, one cut half of a cauliflower wrapped at its cut edge, a small transparent box containing only a handful of spinach, a short bunch of leftover coriander stalks in a jar, half a small container of cooked chickpeas, and half a small covered container of coconut milk. Show refrigerator walls, shelf edges and cool interior light so this cannot look like a countertop still life. Small leftover quantities with opened or cut storage cues. Absolutely no whole cauliflower, no abundant harvest, no serving bowls, no yogurt, no pristine full vegetables, no unrelated food."],
  ["low-waste-vegan-indian-kitchen", "freezer-portions", "View inside an actual domestic freezer drawer with visible cold frost and condensation. Neatly stacked freezer-safe reusable containers hold identifiable meal-sized portions of cooked chickpeas, red lentil dal, tomato curry base, chopped ginger cubes and separated flatbreads in a freezer bag. Containers have simple blank date-label stickers with no readable text. Everything is visibly frozen, cold and stored inside the freezer, not displayed on a worktop. No dry uncooked lentils, no jars, no room-temperature scene."],
  ["low-waste-vegan-indian-kitchen", "pantry-storage", "A tidy Indian pantry scene with glass jars of lentils, chickpeas, basmati rice and whole spices beside onions, garlic and ginger, practical rather than decorative."],
  ["weekly-vegan-indian-grocery-list", "balanced-weekly-basket", "A balanced weekly grocery basket unpacked onto the table: cauliflower, potatoes, spinach, onions, garlic, ginger, lemons, coriander, tofu, chickpeas and red lentils."],
  ["weekly-vegan-indian-grocery-list", "pantry-check", "An open kitchen pantry viewed during a pre-shopping stock check. Partly used clear jars of basmati rice, red lentils and chickpeas sit beside one tin of tomatoes, coconut milk, neutral oil, tomato puree, cumin seeds, ground coriander, turmeric, chilli and garam masala. Include deliberate empty spaces and one nearly empty spice jar to show what needs replenishing. Practical cupboard storage, not ingredients styled in serving bowls. No fresh produce and no lavish abundance."],
];

const only = process.argv.find((argument) => argument.startsWith("--only="))
  ?.slice("--only=".length)
  .split(",")
  .filter(Boolean);

for (const [guide, name, subject] of jobs) {
  if (only && !only.includes(name)) continue;
  const outputDir = path.join(process.cwd(), "public", "images", "guides", guide);
  fs.mkdirSync(outputDir, { recursive: true });
  const output = path.join(outputDir, `${name}.webp`);
  if (fs.existsSync(output) && !process.argv.includes("--force")) {
    console.log(`Skipping existing ${output}`);
    continue;
  }

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
  await sharp(buffer)
    .resize(1200, 800, { fit: "cover", position: "centre" })
    .webp({ quality: 86 })
    .toFile(output);
  console.log(output);
}
