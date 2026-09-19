#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";

const root = process.cwd();
const out = path.join(root, "public", "social", "1000-followers-bread-guide");
const source = path.join(out, "source");
fs.mkdirSync(out, { recursive: true });

const width = 1080;
const height = 1080;
const font = opentype.loadSync(path.join(root, "public", "fonts", "Rajdhani-Bold.ttf"));
const regularFont = opentype.loadSync(path.join(root, "public", "fonts", "Rajdhani-Medium.ttf"));
const backgroundPath = path.join(root, "public", "images", "page-background.jpg");
const logoPath = path.join(root, "public", "brand", "logo-flat.png");

const photos = {
  feast: path.join(source, "indian-bread-feast.png"),
  rolling: path.join(root, "tmp", "pdfs", "indian-breads-assets", "rolling-chapati.png"),
  tandoor: path.join(root, "tmp", "pdfs", "indian-breads-assets", "tandoor-baker.png"),
  table: path.join(root, "tmp", "pdfs", "indian-breads-assets", "bread-at-table.png"),
};

const brand = {
  black: "#071216",
  panel: "#0d1c21",
  gold: "#d6b25e",
  goldBright: "#f0cd68",
  cream: "#f7f2e5",
  soft: "#d8d0bd",
  red: "#a92f31",
};

function glyphPath(text, size, fill, x, baselineY, options = {}) {
  const selectedFont = options.regular ? regularFont : font;
  const align = options.align || "center";
  const tracking = options.tracking || 0;
  const glyphs = selectedFont.stringToGlyphs(text);
  const scale = size / (selectedFont.unitsPerEm || 1000);
  let cursorX = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  const paths = [];

  for (const glyph of glyphs) {
    const item = glyph.getPath(cursorX, baselineY, size);
    const box = item.getBoundingBox();
    minX = Math.min(minX, box.x1);
    maxX = Math.max(maxX, box.x2);
    paths.push(item.toPathData(2));
    cursorX += (glyph.advanceWidth || 500) * scale + tracking;
  }

  const offset = align === "left" ? x - minX : x - (minX + (maxX - minX) / 2);
  return `<g transform="translate(${offset},0)"><path d="${paths.join(" ")}" fill="${fill}"/></g>`;
}

function multiLine(lines, size, fill, centreX, firstBaseline, lineGap = 1.04) {
  return lines
    .map((line, index) => glyphPath(line, size, fill, centreX, firstBaseline + index * size * lineGap))
    .join("\n");
}

async function roundedPhoto(photoPath, w, h, position = "centre") {
  const image = await sharp(photoPath)
    .resize(w, h, { fit: "cover", position })
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" rx="20" fill="#fff"/></svg>`);
  return sharp(image).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

function baseSvg(extra = "") {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${brand.black}" fill-opacity="0.42"/>
      <rect x="24" y="24" width="1032" height="1032" rx="36" fill="none" stroke="${brand.gold}" stroke-width="4"/>
      ${extra}
    </svg>
  `);
}

function transparentSvg(extra = "") {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${extra}</svg>`);
}

async function commonBase() {
  return sharp(backgroundPath)
    .resize(width, height, { fit: "cover" })
    .modulate({ brightness: 0.92, saturation: 0.9 })
    .toBuffer();
}

async function logoBuffer(size = 146) {
  return sharp(logoPath).resize({ width: size }).png().toBuffer();
}

function frameSvg(frames) {
  return frames
    .map(({ x, y, w, h }) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="none" stroke="${brand.gold}" stroke-width="4"/>`)
    .join("\n");
}

async function renderSlide1() {
  const frames = [
    { x: 62, y: 390, w: 456, h: 320, path: photos.feast, position: "centre" },
    { x: 538, y: 390, w: 480, h: 150, path: photos.rolling, position: "centre" },
    { x: 538, y: 560, w: 480, h: 150, path: photos.tandoor, position: "centre" },
  ];
  const panel = `
    <rect x="62" y="735" width="956" height="277" rx="24" fill="${brand.panel}" fill-opacity="0.96" stroke="${brand.gold}" stroke-width="3"/>
    ${glyphPath("VEGAN MASALA COMMUNITY", 29, brand.gold, 540, 202, { tracking: 3 })}
    ${multiLine(["1,000 OF YOU.", "THANK YOU."], 72, brand.cream, 540, 276, 0.96)}
    ${frameSvg(frames)}
    ${glyphPath("THANK YOU FOR EVERY FOLLOW, SAVE & SHARE", 29, brand.goldBright, 540, 793, { tracking: 1.1 })}
    ${multiLine(["AUTHENTIC INDIAN", "VEGAN BREADS"], 50, brand.cream, 540, 858, 0.94)}
    <rect x="286" y="939" width="508" height="56" rx="16" fill="${brand.red}"/>
    ${glyphPath("VEGAN-MASALA.COM/BREAD-GUIDE", 29, "#ffffff", 540, 976)}
  `;
  const base = await commonBase();
  const composites = [{ input: baseSvg(panel), left: 0, top: 0 }];
  for (const frame of frames) {
    composites.push({ input: await roundedPhoto(frame.path, frame.w, frame.h, frame.position), left: frame.x, top: frame.y });
  }
  composites.push({ input: transparentSvg(frameSvg(frames)), left: 0, top: 0 });
  composites.push({ input: await logoBuffer(140), left: 470, top: 44 });
  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(out, "01-thank-you-1000.png"));
}

async function renderCultureSlide() {
  const frames = [
    { x: 62, y: 322, w: 956, h: 338, path: photos.table, position: "centre" },
  ];
  const panel = `
    ${glyphPath("AN EVERYDAY PART OF INDIAN FOOD CULTURE", 26, brand.gold, 540, 185, { tracking: 2 })}
    ${multiLine(["WHY BREAD", "MATTERS"], 67, brand.cream, 540, 245, 0.92)}
    ${frameSvg(frames)}
    <rect x="62" y="684" width="956" height="328" rx="24" fill="${brand.panel}" fill-opacity="0.96" stroke="${brand.gold}" stroke-width="3"/>
    ${glyphPath("AFFORDABLE • PRACTICAL • MADE TO SHARE", 31, brand.goldBright, 540, 742, { tracking: 1.5 })}
    ${glyphPath("ROTI CAN BE TORN, FOLDED AND USED TO", 31, brand.cream, 540, 803)}
    ${glyphPath("GATHER DAL, SABZI AND CURRY—FOOD AND", 31, brand.cream, 540, 849)}
    ${glyphPath("UTENSIL TOGETHER AT THE INDIAN TABLE.", 31, brand.cream, 540, 895)}
    ${glyphPath("DISCOVER REGIONAL GRAINS, OVENS & TECHNIQUES IN THE FREE GUIDE", 23, brand.soft, 540, 948)}
    <rect x="274" y="964" width="532" height="36" rx="12" fill="${brand.red}"/>
    ${glyphPath("VEGAN-MASALA.COM/BREAD-GUIDE", 23, "#ffffff", 540, 989)}
  `;
  const base = await commonBase();
  const composites = [{ input: baseSvg(panel), left: 0, top: 0 }];
  for (const frame of frames) {
    composites.push({ input: await roundedPhoto(frame.path, frame.w, frame.h, frame.position), left: frame.x, top: frame.y });
  }
  composites.push({ input: transparentSvg(frameSvg(frames)), left: 0, top: 0 });
  composites.push({ input: await logoBuffer(126), left: 477, top: 42 });
  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(out, "02-why-bread-matters.png"));
}

async function renderSlide2() {
  const frames = [
    { x: 62, y: 320, w: 456, h: 320, path: photos.rolling, position: "centre" },
    { x: 538, y: 320, w: 480, h: 150, path: photos.tandoor, position: "centre" },
    { x: 538, y: 490, w: 480, h: 150, path: photos.table, position: "centre" },
  ];
  const panel = `
    ${glyphPath("FREE ILLUSTRATED GUIDE", 29, brand.gold, 540, 186, { tracking: 3 })}
    ${multiLine(["AUTHENTIC INDIAN", "VEGAN BREADS"], 61, brand.cream, 540, 246, 0.93)}
    ${frameSvg(frames)}
    <rect x="62" y="662" width="956" height="350" rx="24" fill="${brand.panel}" fill-opacity="0.96" stroke="${brand.gold}" stroke-width="3"/>
    ${glyphPath("INSIDE THE GUIDE", 30, brand.goldBright, 96, 721, { align: "left", tracking: 2 })}
    ${glyphPath("ROTI, NAAN, POORI & REGIONAL BREADS", 31, brand.cream, 96, 775, { align: "left" })}
    ${glyphPath("TANDOOR, TAWA & HOME-KITCHEN TECHNIQUES", 31, brand.cream, 96, 825, { align: "left" })}
    ${glyphPath("CULTURE, FLOUR, SHAPING & TROUBLESHOOTING", 31, brand.cream, 96, 875, { align: "left" })}
    ${glyphPath("EQUIPMENT & INGREDIENT RECOMMENDATIONS", 31, brand.cream, 96, 925, { align: "left" })}
    <rect x="261" y="949" width="558" height="47" rx="14" fill="${brand.red}"/>
    ${glyphPath("VEGAN-MASALA.COM/BREAD-GUIDE", 27, "#ffffff", 540, 981)}
  `;
  const base = await commonBase();
  const composites = [{ input: baseSvg(panel), left: 0, top: 0 }];
  for (const frame of frames) {
    composites.push({ input: await roundedPhoto(frame.path, frame.w, frame.h, frame.position), left: frame.x, top: frame.y });
  }
  composites.push({ input: transparentSvg(frameSvg(frames)), left: 0, top: 0 });
  composites.push({ input: await logoBuffer(126), left: 477, top: 42 });
  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(out, "03-free-bread-guide.png"));
}

async function renderSlide3() {
  const frames = [
    { x: 62, y: 335, w: 620, h: 312, path: photos.table, position: "centre" },
    { x: 702, y: 335, w: 316, h: 312, path: photos.feast, position: "centre" },
  ];
  const panel = `
    ${glyphPath("RECIPES  •  GUIDES  •  KITCHEN CONFIDENCE", 25, brand.gold, 540, 186, { tracking: 2 })}
    ${multiLine(["COOK WITH", "VEGAN MASALA"], 67, brand.cream, 540, 246, 0.92)}
    ${frameSvg(frames)}
    <rect x="62" y="674" width="956" height="338" rx="24" fill="${brand.panel}" fill-opacity="0.96" stroke="${brand.gold}" stroke-width="3"/>
    ${glyphPath("FOLLOW @VEGANMASALAONLINE", 39, brand.goldBright, 540, 744)}
    ${glyphPath("FOLLOW VEGAN MASALA ON FACEBOOK", 34, brand.cream, 540, 801)}
    ${glyphPath("VISIT FOR AUTHENTIC RECIPES, FREE GUIDES", 28, brand.soft, 540, 858)}
    ${glyphPath("AND HONEST EQUIPMENT RECOMMENDATIONS", 28, brand.soft, 540, 898)}
    <rect x="248" y="925" width="584" height="57" rx="16" fill="${brand.red}"/>
    ${glyphPath("VEGAN-MASALA.COM", 34, "#ffffff", 540, 965)}
    ${glyphPath("Some guide links are affiliate links; we may earn a commission at no extra cost to you.", 18, brand.soft, 540, 1001, { regular: true })}
  `;
  const base = await commonBase();
  const composites = [{ input: baseSvg(panel), left: 0, top: 0 }];
  for (const frame of frames) {
    composites.push({ input: await roundedPhoto(frame.path, frame.w, frame.h, frame.position), left: frame.x, top: frame.y });
  }
  composites.push({ input: transparentSvg(frameSvg(frames)), left: 0, top: 0 });
  composites.push({ input: await logoBuffer(126), left: 477, top: 42 });
  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(out, "04-follow-and-visit.png"));
}

async function renderStory() {
  const storyW = 1080;
  const storyH = 1920;
  const photoFrames = [
    { x: 70, y: 560, w: 600, h: 500, path: photos.feast, position: "centre" },
    { x: 690, y: 560, w: 320, h: 240, path: photos.rolling, position: "centre" },
    { x: 690, y: 820, w: 320, h: 240, path: photos.tandoor, position: "centre" },
  ];
  const storyBg = await sharp(backgroundPath)
    .resize(storyW, storyH, { fit: "cover" })
    .modulate({ brightness: 0.92, saturation: 0.9 })
    .toBuffer();
  const storySvg = Buffer.from(`
    <svg width="${storyW}" height="${storyH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${storyW}" height="${storyH}" fill="${brand.black}" fill-opacity="0.42"/>
      <rect x="28" y="28" width="1024" height="1864" rx="38" fill="none" stroke="${brand.gold}" stroke-width="4"/>
      ${glyphPath("THANK YOU FOR HELPING US REACH", 30, brand.gold, 540, 260, { tracking: 2 })}
      ${multiLine(["1,000", "FOLLOWERS"], 100, brand.cream, 540, 370, 0.94)}
      ${frameSvg(photoFrames)}
      <rect x="70" y="1100" width="940" height="590" rx="28" fill="${brand.panel}" fill-opacity="0.96" stroke="${brand.gold}" stroke-width="3"/>
      ${glyphPath("A FREE THANK-YOU FROM OUR KITCHEN", 32, brand.goldBright, 540, 1170, { tracking: 1.5 })}
      ${multiLine(["AUTHENTIC INDIAN", "VEGAN BREADS"], 63, brand.cream, 540, 1255, 0.94)}
      ${glyphPath("ROTI • NAAN • POORI • TANDOOR • CULTURE", 30, brand.soft, 540, 1405)}
      ${glyphPath("TAP THE LINK STICKER TO GET THE FREE GUIDE", 30, brand.cream, 540, 1470)}
      <rect x="210" y="1525" width="660" height="86" rx="22" fill="${brand.red}"/>
      ${glyphPath("ADD LINK STICKER HERE", 36, "#ffffff", 540, 1582)}
      ${glyphPath("VEGAN-MASALA.COM/BREAD-GUIDE", 28, brand.goldBright, 540, 1655)}
      ${glyphPath("FOLLOW @VEGANMASALAONLINE • FIND US ON FACEBOOK", 27, brand.cream, 540, 1794)}
    </svg>
  `);
  const composites = [{ input: storySvg, left: 0, top: 0 }];
  for (const frame of photoFrames) {
    composites.push({ input: await roundedPhoto(frame.path, frame.w, frame.h, frame.position), left: frame.x, top: frame.y });
  }
  composites.push({ input: Buffer.from(`<svg width="${storyW}" height="${storyH}" xmlns="http://www.w3.org/2000/svg">${frameSvg(photoFrames)}</svg>`), left: 0, top: 0 });
  composites.push({ input: await logoBuffer(160), left: 460, top: 70 });
  await sharp(storyBg).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(out, "instagram-story-link-sticker.png"));
}

for (const file of [backgroundPath, logoPath, ...Object.values(photos)]) {
  if (!fs.existsSync(file)) throw new Error(`Missing required campaign asset: ${file}`);
}

await renderSlide1();
await renderCultureSlide();
await renderSlide2();
await renderSlide3();
await renderStory();

console.log(`Created 4-slide campaign and Story asset in ${out}`);
