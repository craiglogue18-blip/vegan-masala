#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const root = process.cwd();
const recipesDir = path.join(root, "content", "recipes");
const publicDir = path.join(root, "public");
const maxBytes = 1_000_000;
const maxDimension = 1800;
let converted = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const recipeFile of fs.readdirSync(recipesDir).filter((name) => /\.mdx?$/.test(name))) {
  const recipePath = path.join(recipesDir, recipeFile);
  const raw = fs.readFileSync(recipePath, "utf8");
  const { data } = matter(raw);
  const publicImage = typeof data.image === "string" ? data.image.trim() : "";
  if (!publicImage.startsWith("/images/recipes/") || publicImage.endsWith(".webp")) continue;

  const source = path.join(publicDir, publicImage.slice(1));
  if (!fs.existsSync(source) || fs.statSync(source).size <= maxBytes) continue;

  const webPath = publicImage.replace(/\.[^.]+$/, ".webp");
  const destination = path.join(publicDir, webPath.slice(1));
  const sourceBytes = fs.statSync(source).size;

  await sharp(source)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 5, smartSubsample: true })
    .toFile(destination);

  const destinationBytes = fs.statSync(destination).size;
  if (destinationBytes >= sourceBytes) {
    fs.rmSync(destination);
    continue;
  }

  fs.writeFileSync(recipePath, raw.replace(publicImage, webPath));
  converted += 1;
  bytesBefore += sourceBytes;
  bytesAfter += destinationBytes;
}

console.log(
  `Optimized ${converted} recipe heroes: ${(bytesBefore / 1_000_000).toFixed(1)} MB → ${(bytesAfter / 1_000_000).toFixed(1)} MB.`
);
