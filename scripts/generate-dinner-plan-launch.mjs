#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";

const root = process.cwd();
const out = path.join(root, "public", "social", "dinner-plan-launch");
fs.mkdirSync(out, { recursive: true });

const font = opentype.loadSync(path.join(root, "public", "fonts", "Rajdhani-Bold.ttf"));
const logo = path.join(root, "public", "brand", "logo-flat.png");
const background = path.join(root, "public", "images", "page-background.jpg");
const image = path.join(root, "public", "images", "recipes", "veg-biryani-vegetable-biryani-recipe.png");

const BRAND = {
  gold: "#d6b25e",
  red: "#9b2c2c",
  text: "#f6f2e6",
};

function textPath(text, size, fill, centreX, baselineY, letterSpacing = 0) {
  const glyphs = font.stringToGlyphs(text);
  const scale = size / (font.unitsPerEm || 1000);
  let cursorX = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  const paths = [];

  for (const glyph of glyphs) {
    const glyphPath = glyph.getPath(cursorX, baselineY, size);
    const box = glyphPath.getBoundingBox();
    minX = Math.min(minX, box.x1);
    maxX = Math.max(maxX, box.x2);
    paths.push(glyphPath.toPathData(2));
    cursorX += (glyph.advanceWidth || 500) * scale + letterSpacing;
  }

  const translateX = centreX - (minX + (maxX - minX) / 2);
  return `<g transform="translate(${translateX},0)"><path d="${paths.join(" ")}" fill="${fill}"/></g>`;
}

async function makeAsset({ width, height, file, eyebrow, title, subtitle, cta, logoPlacement = "photo", logoScale = 0.26, logoBackdrop = false }) {
  const photoHeight = Math.round(height * 0.48);
  const logoWidth = Math.round(width * logoScale);
  const pad = Math.round(width * 0.07);
  const titleLines = Array.isArray(title) ? title : [title];
  const titleY = photoHeight + pad * 2.1;
  const titleSize = Math.round(width * 0.066);
  const titleMarkup = titleLines.map((line, index) => textPath(line, titleSize, BRAND.text, width / 2, titleY + index * titleSize * 0.95, 0.5)).join("\n");
  const subtitleY = titleY + titleLines.length * titleSize * 1.05;
  const photoWidth = width - pad * 2;
  const visiblePhotoHeight = photoHeight - pad;
  const logoHeight = Math.round(logoWidth * 745 / 866);
  const logoTop = logoPlacement === "panel"
    ? Math.round(height - pad * 1.9 - logoHeight - pad * 0.55)
    : Math.round(pad * 1.35);
  const logoBackdropMarkup = logoBackdrop ? `
    <defs>
      <radialGradient id="logo-fade">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.68"/>
        <stop offset="58%" stop-color="#000000" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${width / 2}" cy="${logoTop + logoHeight / 2}" rx="${logoWidth * 0.9}" ry="${logoHeight * 0.72}" fill="url(#logo-fade)"/>` : "";
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${logoBackdropMarkup}
    <rect x="${pad}" y="${pad}" width="${photoWidth}" height="${visiblePhotoHeight}" rx="15" fill="none" stroke="${BRAND.gold}" stroke-width="5"/>
    <rect x="${pad}" y="${photoHeight + pad * 0.55}" width="${width - pad * 2}" height="${height - photoHeight - pad * 1.35}" rx="15" fill="#111c22" fill-opacity="0.92" stroke="${BRAND.gold}" stroke-width="3"/>
    ${textPath(eyebrow.toUpperCase(), Math.round(width * 0.032), BRAND.gold, width / 2, photoHeight + pad * 1.15, 4)}
    ${titleMarkup}
    ${textPath(subtitle, Math.round(width * 0.038), BRAND.text, width / 2, subtitleY)}
    <rect x="${width * 0.2}" y="${height - pad * 1.9}" width="${width * 0.6}" height="${pad * 0.75}" rx="15" fill="${BRAND.red}"/>
    ${textPath(cta, Math.round(width * 0.042), "#ffffff", width / 2, height - pad * 1.4)}
  </svg>`;

  const base = await sharp(background).resize(width, height, { fit: "cover" }).toBuffer();
  const photo = await sharp(image)
    .resize(photoWidth, visiblePhotoHeight, { fit: "cover", position: "centre" })
    .composite([{ input: Buffer.from(`<svg width="${photoWidth}" height="${visiblePhotoHeight}"><rect width="${photoWidth}" height="${visiblePhotoHeight}" rx="15" fill="white"/></svg>`), blend: "dest-in" }])
    .png()
    .toBuffer();
  const logoBuffer = await sharp(logo).resize({ width: logoWidth }).png().toBuffer();

  await sharp(base)
    .composite([
      { input: photo, left: pad, top: pad },
      { input: Buffer.from(svg), left: 0, top: 0 },
      { input: logoBuffer, left: Math.round((width - logoWidth) / 2), top: logoTop },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, file));
}

await makeAsset({
  width: 1000,
  height: 1500,
  file: "pinterest-free-7-day-dinner-plan.png",
  eyebrow: "Free Vegan Indian Meal Plan",
  title: ["7 DINNERS.", "ONE EASY WEEK."],
  subtitle: "Recipes + shopping list + preparation notes",
  cta: "GET THE FREE PLAN",
  logoPlacement: "panel",
});

await makeAsset({
  width: 1000,
  height: 1500,
  file: "pinterest-vegan-indian-week.png",
  eyebrow: "Cook with Vegan Masala",
  title: ["YOUR VEGAN", "INDIAN WEEK"],
  subtitle: "Seven flavour-packed dinners, planned for you",
  cta: "DOWNLOAD FREE",
  logoPlacement: "panel",
});

await makeAsset({
  width: 1080,
  height: 1080,
  file: "instagram-facebook-dinner-plan.png",
  eyebrow: "Free from Vegan Masala",
  title: ["DINNER IS", "PLANNED"],
  subtitle: "7 vegan Indian recipes + one shopping list",
  cta: "LINK IN BIO",
  logoScale: 0.18,
  logoBackdrop: true,
});

console.log(`Created launch assets in ${out}`);
