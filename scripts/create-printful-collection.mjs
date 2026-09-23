import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public", "merch", "printful");
const logoPath = path.join(root, "public", "brand", "logo-primary.png");
const fontRegular = path.join(root, "public", "fonts", "Rajdhani-Regular.ttf");
const fontBold = path.join(root, "public", "fonts", "Rajdhani-Bold.ttf");

const GOLD = "#D7B45A";
const GOLD_LIGHT = "#E7C76C";
const BLACK = "#071012";
const BLACK_2 = "#0D1A1C";
const GREEN = "#7E9B50";
const RUST = "#B94C2D";
const CREAM = "#F2E8CF";

await fs.mkdir(outputDir, { recursive: true });

const fileUri = (file) => `file://${file.replaceAll(" ", "%20")}`;
const fontCss = `
  @font-face { font-family: Rajdhani; src: url('${fileUri(fontRegular)}'); font-weight: 400; }
  @font-face { font-family: Rajdhani; src: url('${fileUri(fontBold)}'); font-weight: 700; }
  text { font-family: Rajdhani, sans-serif; }
`;

function star(cx, cy, outer, inner, points = 8) {
  const coords = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / points;
    coords.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return `<polygon points="${coords.join(" ")}" fill="none" stroke="${GOLD}" stroke-width="12" stroke-linejoin="round"/>`;
}

function cardamom(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${GREEN}" stroke-width="11">
    <ellipse cx="0" cy="0" rx="62" ry="28" transform="rotate(-18)"/>
    <path d="M-55 18 Q0 -5 55 -18"/>
    <ellipse cx="92" cy="-25" rx="58" ry="27" transform="rotate(13 92 -25)"/>
    <path d="M39 -30 Q91 -18 144 -20"/>
  </g>`;
}

function cinnamon(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) rotate(-12) scale(${scale})" fill="none" stroke="${GOLD}" stroke-width="11">
    <rect x="-85" y="-22" width="175" height="44" rx="20"/>
    <ellipse cx="90" cy="0" rx="17" ry="22"/>
    <rect x="-70" y="34" width="175" height="44" rx="20"/>
    <ellipse cx="105" cy="56" rx="17" ry="22"/>
  </g>`;
}

function chilli(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-105 42 C-30 50 40 28 105 -48 C75 44 -5 96 -105 42 Z" fill="none" stroke="${RUST}" stroke-width="13"/>
    <path d="M96 -49 Q116 -70 137 -62" fill="none" stroke="${GREEN}" stroke-width="13" stroke-linecap="round"/>
  </g>`;
}

function seeds(x, y, scale = 1) {
  const dots = [[0,0],[38,-14],[72,8],[20,35],[60,48],[100,32],[110,-6],[145,18],[148,58]];
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${GOLD}">${dots.map(([dx,dy]) => `<ellipse cx="${dx}" cy="${dy}" rx="11" ry="7" transform="rotate(${dx - dy} ${dx} ${dy})"/>`).join("")}</g>`;
}

function cornerOrnaments(width, height, inset = 70) {
  const l = 150;
  return `<g fill="none" stroke="${GOLD}" stroke-width="7">
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="24"/>
    <path d="M${inset} ${inset + l} V${inset} H${inset + l} M${width - inset - l} ${inset} H${width - inset} V${inset + l}
             M${inset} ${height - inset - l} V${height - inset} H${inset + l} M${width - inset - l} ${height - inset} H${width - inset} V${height - inset - l}" stroke-width="15"/>
    <circle cx="${width / 2}" cy="${inset}" r="10" fill="${GOLD}"/>
    <circle cx="${width / 2}" cy="${height - inset}" r="10" fill="${GOLD}"/>
  </g>`;
}

async function resizedLogo(width) {
  return sharp(logoPath).resize({ width, withoutEnlargement: false }).png().toBuffer();
}

async function renderSvg(svg, width, height) {
  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer();
}

async function createJournal() {
  const width = 1800;
  const height = 2700;
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>${fontCss}</style>
    ${cornerOrnaments(width, height, 95)}
    <g opacity=".42" fill="none" stroke="${GOLD}" stroke-width="6">
      <path d="M200 300 Q420 160 640 300 M1160 300 Q1380 160 1600 300"/>
      <path d="M200 2400 Q420 2540 640 2400 M1160 2400 Q1380 2540 1600 2400"/>
    </g>
    <text x="900" y="1670" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="150" font-weight="700" letter-spacing="7">MY CURRY NOTES</text>
    <line x1="420" y1="1780" x2="1380" y2="1780" stroke="${GOLD}" stroke-width="8"/>
    ${star(900, 1780, 36, 16, 4)}
    <text x="900" y="1935" text-anchor="middle" fill="${GOLD}" font-size="82" font-weight="700" letter-spacing="17">RECIPES · SPICES · TIMINGS</text>
    ${cardamom(330, 2240, .78)} ${cinnamon(865, 2255, .75)} ${star(1420, 2240, 75, 31)}
  </svg>`;
  const base = await renderSvg(svg, width, height);
  const logo = await resizedLogo(780);
  await sharp(base).composite([{ input: logo, left: 510, top: 390 }]).png().withMetadata({ density: 300 }).toFile(path.join(outputDir, "my-curry-notes-journal.png"));
}

async function createMug() {
  const width = 3300;
  const height = 1200;
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>${fontCss}</style>
    <g opacity=".98">
      ${cardamom(145, 875, 1.05)} ${star(595, 865, 88, 35)} ${cinnamon(990, 870, .92)}
      ${seeds(1445, 820, 1.15)} ${chilli(2010, 860, 1.05)} ${cardamom(2510, 870, 1.02)} ${star(3100, 860, 88, 35)}
    </g>
    <path d="M90 1080 Q825 980 1650 1075 Q2475 1170 3210 1080" fill="none" stroke="${GOLD}" stroke-width="8" opacity=".72"/>
  </svg>`;
  const base = await renderSvg(svg, width, height);
  const logo = await resizedLogo(660);
  await sharp(base).composite([{ input: logo, left: 1320, top: 65 }]).png().withMetadata({ density: 300 }).toFile(path.join(outputDir, "vegan-masala-chai-mug-wrap.png"));
}

async function createTote() {
  const width = 3600;
  const height = 4200;
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="3600" height="4200" rx="70" fill="${BLACK}"/>
    <rect x="95" y="95" width="3410" height="4010" rx="44" fill="none" stroke="${GOLD}" stroke-width="18"/>
    <rect x="145" y="145" width="3310" height="3910" rx="38" fill="none" stroke="${GOLD}" stroke-width="4" opacity=".7"/>
    <g opacity=".95">
      ${cardamom(520, 3000, 2.25)} ${star(1780, 3040, 250, 98)} ${cinnamon(2650, 3025, 2.05)}
      ${seeds(550, 3550, 2.05)} ${chilli(2450, 3580, 2.15)}
    </g>
    <text x="1800" y="3880" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="116" font-weight="700" letter-spacing="23">SPICES BRING PEOPLE TOGETHER</text>
  </svg>`;
  const base = await renderSvg(svg, width, height);
  const logo = await resizedLogo(1700);
  await sharp(base).composite([{ input: logo, left: 950, top: 430 }]).png().withMetadata({ density: 300 }).toFile(path.join(outputDir, "vegan-masala-spice-market-tote.png"));
}

async function createPoster() {
  const width = 3600;
  const height = 4800;
  const rows = [
    ["CUMIN", "LENTILS · POTATOES · RICE · ROASTED VEGETABLES"],
    ["CORIANDER", "CHICKPEAS · CAULIFLOWER · TOMATO · TOFU"],
    ["TURMERIC", "LENTILS · SQUASH · COCONUT · GREENS"],
    ["CARDAMOM", "RICE · DESSERTS · CHAI · SWEET BREADS"],
    ["CINNAMON", "TOMATO CURRIES · SWEET POTATO · RICE · DESSERTS"],
    ["CHILLI", "BEANS · AUBERGINE · TOMATO · NOODLES"],
  ];
  const rowSvg = rows.map(([spice, pairing], index) => {
    const y = 1700 + index * 435;
    const icon = index === 0 ? seeds(480, y - 45, 1) : index === 1 ? cardamom(460, y - 35, .75) : index === 2 ? star(500, y - 35, 75, 30) : index === 3 ? cardamom(455, y - 35, .75) : index === 4 ? cinnamon(475, y - 35, .7) : chilli(480, y - 35, .72);
    return `<g>${icon}<text x="760" y="${y}" fill="${GOLD_LIGHT}" font-size="96" font-weight="700" letter-spacing="6">${spice}</text><text x="1440" y="${y}" fill="${CREAM}" font-size="45" font-weight="700" letter-spacing="1">${pairing}</text><line x1="500" y1="${y + 165}" x2="3100" y2="${y + 165}" stroke="${GOLD}" stroke-width="5" opacity=".55"/></g>`;
  }).join("");
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>${fontCss}</style>
    <rect width="3600" height="4800" fill="${BLACK}"/>
    <rect x="90" y="90" width="3420" height="4620" rx="25" fill="none" stroke="${GOLD}" stroke-width="18"/>
    <rect x="145" y="145" width="3310" height="4510" rx="18" fill="none" stroke="${GOLD}" stroke-width="4" opacity=".7"/>
    <text x="1800" y="1120" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="132" font-weight="700" letter-spacing="7">INDIAN SPICE PAIRING CHART</text>
    <line x1="500" y1="1320" x2="3100" y2="1320" stroke="${GOLD}" stroke-width="9"/>
    ${rowSvg}
    <text x="1800" y="4520" text-anchor="middle" fill="${GOLD}" font-size="54" font-weight="700" letter-spacing="10">A PRACTICAL GUIDE FOR THE INDIAN KITCHEN</text>
  </svg>`;
  const base = await renderSvg(svg, width, height);
  const logo = await resizedLogo(560);
  await sharp(base).composite([{ input: logo, left: 1520, top: 260 }]).jpeg({ quality: 96, chromaSubsampling: "4:4:4" }).withMetadata({ density: 300 }).toFile(path.join(outputDir, "indian-spice-pairing-chart.jpg"));
}

await Promise.all([createJournal(), createMug(), createTote(), createPoster()]);
console.log(`Created Printful artwork in ${outputDir}`);
