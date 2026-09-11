import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "public/images/social/newsletter/free-dinner-plan-feed-2026-09-v2.png");
const logo = path.join(root, "public/brand/logo-primary.png");
const texture = path.join(root, "public/images/page-background.jpg");
const fontBold = opentype.loadSync(path.join(root, "public/fonts/Rajdhani-Bold.ttf"));
const fontRegular = opentype.loadSync(path.join(root, "public/fonts/Rajdhani-Regular.ttf"));

const meals = [
  "chana-masala.png",
  "tofu-butter-masala-recipe.png",
  "palak-tofu-recipe.png",
  "veg-biryani-vegetable-biryani-recipe.png",
  "vegan-samosa-pie.png",
  "dal-makhani-recipe-authentic-punjabi-style.png",
  "restaurant-style-vegan-malai-kofta.png",
].map((file) => path.join(root, "public/images/recipes", file));

function textPath(text, size, fill, centreX, baselineY, font = fontBold, letterSpacing = 0) {
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
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
  return `<g transform="translate(${centreX - (minX + maxX) / 2},0)"><path d="${paths.join(" ")}" fill="${fill}"/></g>`;
}

async function mealTile(file, width, height, day) {
  const label = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" rx="14" fill="none" stroke="#d4af37" stroke-width="3"/>
    <rect x="12" y="12" width="70" height="36" rx="5" fill="#0b1216" fill-opacity="0.92" stroke="#d4af37" stroke-width="1.5"/>
    ${textPath(day, 22, "#f6f2e6", 47, 39)}
  </svg>`);
  return sharp(file)
    .resize(width, height, { fit: "cover", position: "centre" })
    .composite([
      { input: Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="14" fill="white"/></svg>`), blend: "dest-in" },
      { input: label },
    ])
    .png()
    .toBuffer();
}

const canvas = await sharp(texture).resize(1080, 1080, { fit: "cover" }).modulate({ brightness: 0.24, saturation: 0.55 }).blur(0.3).toBuffer();
const logoBuffer = await sharp(logo).resize({ width: 160 }).png().toBuffer();
const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const composites = [{ input: logoBuffer, left: 460, top: 30 }];
const gap = 12;
const margin = 34;
const row1Width = 244;
const row2Width = 326;
const tileHeight = 214;

for (let i = 0; i < 4; i++) {
  composites.push({ input: await mealTile(meals[i], row1Width, tileHeight, days[i]), left: margin + i * (row1Width + gap), top: 244 });
}
for (let i = 0; i < 3; i++) {
  composites.push({ input: await mealTile(meals[i + 4], row2Width, tileHeight, days[i + 4]), left: margin + i * (row2Width + gap), top: 470 });
}

const typography = Buffer.from(`<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect x="22" y="22" width="1036" height="1036" rx="16" fill="none" stroke="#d4af37" stroke-width="3"/>
  ${textPath("7 NIGHTS. ONE EASY WEEK.", 58, "#f6f2e6", 540, 205, fontBold, 1)}
  <rect x="34" y="715" width="1012" height="320" rx="18" fill="#0b1216" fill-opacity="0.94" stroke="#d4af37" stroke-width="2"/>
  ${textPath("YOUR FREE VEGAN INDIAN DINNER PLAN", 43, "#d4af37", 540, 790, fontBold, 0.7)}
  ${textPath("Seven recipes + one ready-made shopping list", 31, "#f6f2e6", 540, 850, fontRegular)}
  <rect x="277" y="884" width="526" height="91" rx="12" fill="#9b2c2c"/>
  ${textPath("GET THE FREE PLAN", 35, "#ffffff", 540, 944, fontBold, 0.7)}
  ${textPath("JOIN THE VEGAN MASALA NEWSLETTER", 21, "#d8b45a", 540, 1012, fontBold, 2.1)}
</svg>`);
composites.push({ input: typography, left: 0, top: 0 });

await sharp(canvas).composite(composites).png({ compressionLevel: 9 }).toFile(output);
console.log(output);
