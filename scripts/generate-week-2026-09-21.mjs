#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import opentype from "opentype.js";
import sharp from "sharp";

const run = promisify(execFile);
const root = process.cwd();
const out = path.join(root, "public", "social", "week-2026-09-21");
const source = path.join(out, "source");
const font = opentype.loadSync(path.join(root, "public", "fonts", "Rajdhani-Bold.ttf"));
const regular = opentype.loadSync(path.join(root, "public", "fonts", "Rajdhani-Medium.ttf"));
const logo = path.join(root, "public", "brand", "logo-flat.png");
const background = path.join(root, "public", "images", "page-background.jpg");
const site = "https://www.vegan-masala.com";
const gold = "#e3bd56";
const cream = "#fff8e8";
const red = "#ad3032";
const panel = "#071216";

fs.mkdirSync(out, { recursive: true });

function glyph(text, size, fill, x, y, options = {}) {
  const selected = options.regular ? regular : font;
  const glyphs = selected.stringToGlyphs(text);
  const scale = size / selected.unitsPerEm;
  let cursor = 0;
  let min = Infinity;
  let max = -Infinity;
  const paths = [];
  for (const item of glyphs) {
    const itemPath = item.getPath(cursor, y, size);
    const box = itemPath.getBoundingBox();
    min = Math.min(min, box.x1);
    max = Math.max(max, box.x2);
    paths.push(itemPath.toPathData(2));
    cursor += (item.advanceWidth || 500) * scale + (options.tracking || 0);
  }
  const offset = options.align === "left" ? x - min : x - (min + (max - min) / 2);
  return `<g transform="translate(${offset},0)"><path d="${paths.join(" ")}" fill="${fill}"/></g>`;
}

function lines(items, size, fill, x, firstY, gap = 1.08, options = {}) {
  return items.map((item, index) => glyph(item, size, fill, x, firstY + index * size * gap, options)).join("\n");
}

function split(text, max = 30) {
  const words = text.split(/\s+/);
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      result.push(current);
      current = word;
    } else current = next;
  }
  if (current) result.push(current);
  return result;
}

async function framed(photo, width, height, position = "centre") {
  const image = await sharp(photo).resize(width, height, { fit: "cover", position }).png().toBuffer();
  const mask = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="30" fill="white"/></svg>`);
  return sharp(image).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function portrait({ photo, kicker, title, body, cta, file }) {
  const w = 1080;
  const h = 1920;
  const base = await sharp(background).resize(w, h, { fit: "cover" }).modulate({ brightness: 1.12, saturation: 0.92 }).png().toBuffer();
  const photoBuffer = await framed(photo, 952, 1120, "centre");
  const titleLines = split(title.toUpperCase(), 24).slice(0, 3);
  const bodyLines = split(body, 43).slice(0, 3);
  const overlay = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#071216" fill-opacity=".32"/>
    <rect x="30" y="30" width="1020" height="1860" rx="42" fill="none" stroke="${gold}" stroke-width="4"/>
    <rect x="64" y="330" width="952" height="1120" rx="30" fill="none" stroke="${gold}" stroke-width="4"/>
    <rect x="64" y="1290" width="952" height="450" rx="30" fill="${panel}" fill-opacity=".94" stroke="${gold}" stroke-width="3"/>
    ${glyph(kicker.toUpperCase(), 32, gold, 540, 275, { tracking: 2 })}
    ${lines(titleLines, 67, cream, 110, 1385, .98, { align: "left" })}
    ${lines(bodyLines, 31, "#e8dfca", 110, 1585, 1.16, { regular: true, align: "left" })}
    <rect x="110" y="1768" width="610" height="78" rx="20" fill="${red}"/>
    ${glyph(cta.toUpperCase(), 32, "#ffffff", 415, 1819)}
    ${glyph("VEGAN-MASALA.COM", 24, gold, 920, 1820)}
  </svg>`);
  const logoBuffer = await sharp(logo).resize({ width: 180 }).png().toBuffer();
  const output = path.join(out, file);
  await sharp(base).composite([
    { input: photoBuffer, left: 64, top: 330 },
    { input: overlay, left: 0, top: 0 },
    { input: logoBuffer, left: 450, top: 62 },
  ]).png({ compressionLevel: 9 }).toFile(output);
  return output;
}

async function video(still, file) {
  const encoder = typeof ffmpegPath === "string" && fs.existsSync(ffmpegPath)
    ? ffmpegPath
    : "/opt/homebrew/bin/ffmpeg";
  if (!fs.existsSync(encoder)) throw new Error("ffmpeg is unavailable");
  const output = path.join(out, file);
  await run(encoder, [
    "-y", "-loop", "1", "-i", still, "-t", "12",
    "-vf", "zoompan=z='min(zoom+0.00038,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1080x1920:fps=30,format=yuv420p",
    "-r", "30", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-movflags", "+faststart", output,
  ]);
  const check = path.join(out, `${path.basename(file, ".mp4")}-first-frame.jpg`);
  await run(encoder, ["-y", "-ss", "0", "-i", output, "-frames:v", "1", "-q:v", "2", check]);
  const stats = await sharp(check).stats();
  const mean = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3;
  if (mean < 18) throw new Error(`${file} has an unexpectedly dark first frame (${mean.toFixed(1)})`);
  return { output, check, mean: Number(mean.toFixed(1)) };
}

async function square({ photos, kicker, title, body, cta, file }) {
  const w = 1080;
  const h = 1080;
  const base = await sharp(background).resize(w, h, { fit: "cover" }).modulate({ brightness: 1.12, saturation: .92 }).png().toBuffer();
  const frames = photos.length === 1
    ? [{ x: 64, y: 260, w: 952, h: 430, photo: photos[0] }]
    : [
        { x: 64, y: 270, w: 598, h: 420, photo: photos[0] },
        { x: 682, y: 270, w: 334, h: 200, photo: photos[1] },
        { x: 682, y: 490, w: 334, h: 200, photo: photos[2] || photos[0] },
      ];
  const titleLines = split(title.toUpperCase(), 31).slice(0, 2);
  const bodyLines = split(body, 55).slice(0, 3);
  const overlay = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#071216" fill-opacity=".30"/>
    <rect x="26" y="26" width="1028" height="1028" rx="38" fill="none" stroke="${gold}" stroke-width="4"/>
    ${glyph(kicker.toUpperCase(), 27, gold, 540, 190, { tracking: 2 })}
    ${frames.map((f) => `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="26" fill="none" stroke="${gold}" stroke-width="4"/>`).join("\n")}
    <rect x="64" y="718" width="952" height="286" rx="28" fill="${panel}" fill-opacity=".95" stroke="${gold}" stroke-width="3"/>
    ${lines(titleLines, 52, cream, 104, 790, .98, { align: "left" })}
    ${lines(bodyLines, 25, "#e8dfca", 104, 902, 1.16, { regular: true, align: "left" })}
    <rect x="730" y="938" width="238" height="46" rx="14" fill="${red}"/>
    ${glyph(cta.toUpperCase(), 21, "#ffffff", 849, 968)}
  </svg>`);
  const composites = [];
  for (const f of frames) composites.push({ input: await framed(f.photo, f.w, f.h), left: f.x, top: f.y });
  composites.push({ input: overlay, left: 0, top: 0 });
  composites.push({ input: await sharp(logo).resize({ width: 130 }).png().toBuffer(), left: 475, top: 38 });
  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(path.join(out, file));
}

const portraits = [
  {
    id: "monday-roti", photo: path.join(source, "roti-puff-action.png"), kicker: "Bread technique",
    title: "The moment a roti puffs", body: "Steam separates the layers. Even heat and an even roll help it inflate.", cta: "Get the free bread guide",
    url: `${site}/bread-guide?utm_source=social&utm_medium=organic_video&utm_campaign=weekly_content`,
    schedule: "2026-09-21T18:30:00+01:00", platforms: ["instagram", "facebook", "tiktok"],
  },
  {
    id: "tuesday-balti", photo: path.join(source, "balti-onion-action.png"), kicker: "Build the base",
    title: "Do not rush the onions", body: "Cook until softened and golden: this is where a balti begins to build sweetness and body.", cta: "Cook vegetable balti",
    url: `${site}/recipes/vegetable-balti?utm_source=social&utm_medium=organic_video&utm_campaign=weekly_content`,
    schedule: "2026-09-22T18:30:00+01:00", platforms: ["facebook", "instagram"],
  },
  {
    id: "thursday-aloo-matar", photo: path.join(source, "aloo-matar-action.png"), kicker: "Aloo matar method",
    title: "Potatoes first. Peas later.", body: "Let the potatoes take on the masala before adding peas, so both finish with the right texture.", cta: "See the full recipe",
    url: `${site}/recipes/aloo-muttar?utm_source=social&utm_medium=organic_video&utm_campaign=weekly_content`,
    schedule: "2026-09-24T18:30:00+01:00", platforms: ["facebook", "instagram", "tiktok"],
  },
  {
    id: "saturday-jackfruit", photo: path.join(source, "jackfruit-action.png"), kicker: "Saturday curry",
    title: "Make jackfruit hold the masala", body: "Break up the fibres as you stir, then cook until the sauce clings instead of pooling.", cta: "Cook jackfruit curry",
    url: `${site}/recipes/the-best-jackfruit-curry?utm_source=social&utm_medium=organic_video&utm_campaign=weekly_content`,
    schedule: "2026-09-26T11:00:00+01:00", platforms: ["instagram", "facebook"],
  },
];

const videoChecks = [];
for (const item of portraits) {
  const still = await portrait({ ...item, file: `${item.id}-cover.png` });
  videoChecks.push({ id: item.id, ...(await video(still, `${item.id}.mp4`)) });
}

const herbPhotos = [
  path.join(root, "public", "images", "guides", "herbs.jpg"),
  path.join(root, "public", "images", "guides", "how-to-temper-spices", "curry-leaves.png"),
  path.join(root, "public", "images", "guides", "indian-spices-explained-for-beginners", "fenugreek.png"),
];
const breadPhotos = [
  path.join(source, "roti-puff-action.png"),
  path.join(root, "public", "images", "recipes", "vegan-garlic-naan.png"),
  path.join(root, "public", "images", "recipes", "poori.png"),
];
const dinnerPhotos = [
  path.join(root, "public", "images", "recipes", "chana-masala.png"),
  path.join(root, "public", "images", "recipes", "vegetable-balti.png"),
  path.join(root, "public", "images", "recipes", "the-best-jackfruit-curry.png"),
];

const carousels = [
  {
    id: "wednesday-herbs", schedule: "2026-09-23T12:15:00+01:00", platforms: ["instagram", "facebook", "pinterest"],
    url: `${site}/guides/herbs?utm_source=social&utm_medium=organic_social&utm_campaign=weekly_content`,
    slides: [
      ["Fresh or dried?", "Fresh coriander finishes a dish. Dried fenugreek transforms the sauce.", "Swipe to compare"],
      ["Fresh herbs", "Add tender leaves near the end so their colour and aroma stay bright.", "Save this tip"],
      ["Dried herbs", "Crush kasuri methi between your palms, then add sparingly near the end.", "Read the herb guide"],
    ], photos: herbPhotos,
  },
  {
    id: "friday-bread-tools", schedule: "2026-09-25T12:15:00+01:00", platforms: ["instagram", "facebook", "pinterest"],
    url: `${site}/bread-guide?utm_source=social&utm_medium=organic_social&utm_campaign=weekly_content`,
    slides: [
      ["Three useful bread tools", "A heavy tawa, simple rolling pin and sturdy bowl cover most home breads.", "Swipe for the shortlist"],
      ["Start with a tawa", "Even heat helps roti colour and puff without drying out.", "Get the free guide"],
      ["Buy only what earns its place", "Our guide includes practical equipment links with a clear affiliate disclosure.", "Explore the bread guide"],
    ], photos: breadPhotos,
  },
  {
    id: "sunday-dinner", schedule: "2026-09-27T10:30:00+01:00", platforms: ["instagram", "facebook", "pinterest"],
    url: `${site}/dinner-plan?utm_source=social&utm_medium=organic_social&utm_campaign=weekly_content`,
    slides: [
      ["Dinner sorted for the week", "Seven vegan Indian dinners, one combined shopping list and practical preparation notes.", "Swipe for the plan"],
      ["Cook once. Build momentum.", "Choose a curry, a dal and a vegetable dish that share useful prep.", "Save for Sunday"],
      ["Get the free 7-day plan", "Join the newsletter and make the next seven dinners easier.", "Get the free plan"],
    ], photos: dinnerPhotos,
  },
];

for (const item of carousels) {
  for (let index = 0; index < item.slides.length; index += 1) {
    const [title, body, cta] = item.slides[index];
    const photos = index === 0 ? item.photos : [item.photos[index]];
    await square({ photos, kicker: index === 0 ? "Vegan Masala guide" : `${index + 1} of ${item.slides.length}`, title, body, cta, file: `${item.id}-${index + 1}.png` });
  }
}

const captions = {
  "monday-roti": "That puff is not luck. As a roti hits even heat, trapped steam separates its layers and inflates the bread. Roll evenly, preheat the tawa and turn at the right moment. Get our free illustrated guide to authentic Indian vegan breads at the link in bio. #roti #chapati #indianbread #vegancooking #veganmasala",
  "tuesday-balti": "A good Vegetable Balti starts before the vegetables go in. Give the onions time to soften and turn golden: that sweetness becomes part of the body of the sauce. Full method on Vegan Masala. #vegetablebalti #indiancooking #veganrecipes #currytips",
  "wednesday-herbs": "Fresh and dried herbs do different jobs in Indian cooking. Fresh coriander brings a bright finish; dried fenugreek adds a deep savoury aroma. Swipe for the practical rule, then save this for your next curry. #indianherbs #kasurimethi #cookingtips #veganindianfood",
  "thursday-aloo-matar": "For Aloo Matar with distinct potatoes and sweet green peas, timing matters. Let the potatoes take on the masala first; add peas later so they stay green and tender. Find the full tested recipe on Vegan Masala. #aloomatar #indianfood #veganrecipes #cookingprocess",
  "friday-bread-tools": "You do not need a cupboard of specialist kit to make Indian bread at home. A reliable tawa, a simple rolling pin and a sturdy bowl will take you a long way. Our free illustrated bread guide explains the tools, techniques and traditions. Some links are affiliate links; we may earn a commission at no extra cost to you. #indianbread #roti #naan #kitchentools",
  "saturday-jackfruit": "The key to jackfruit curry is getting the masala to cling to the fibres. Break up the pieces as you stir, then keep cooking until the sauce looks glossy rather than loose. Full recipe on Vegan Masala. #jackfruitcurry #vegancurry #indiancooking #plantbased",
  "sunday-dinner": "Make Sunday the moment dinner gets easier. Our free seven-day vegan Indian dinner plan includes seven meals, one combined shopping list and useful preparation notes. Get it through the link in bio. #mealplanning #veganmealplan #indianrecipes #weeknightdinner",
};

const schedule = [
  ...portraits.map((item) => ({ ...item, type: "video", asset: `${item.id}.mp4`, cover: `${item.id}-cover.png`, caption: captions[item.id], requiresApproval: true })),
  ...carousels.map((item) => ({ ...item, type: "carousel", assets: item.slides.map((_, index) => `${item.id}-${index + 1}.png`), caption: captions[item.id], requiresApproval: true })),
].sort((a, b) => new Date(a.schedule) - new Date(b.schedule));

fs.writeFileSync(path.join(out, "campaign.json"), JSON.stringify({ name: "Growth week · 21–27 September 2026", status: "review", publishAllowed: false, schedule, videoChecks }, null, 2));

const cards = schedule.map((item) => {
  const media = item.type === "video"
    ? `<video controls playsinline preload="metadata" poster="${item.cover}" src="${item.asset}"></video>`
    : `<div class="carousel" data-index="0">${item.assets.map((asset, index) => `<img src="${asset}" alt="${item.id} slide ${index + 1}" class="${index === 0 ? "active" : ""}">`).join("")}<button class="prev" aria-label="Previous">‹</button><button class="next" aria-label="Next">›</button><span>1 / ${item.assets.length}</span></div>`;
  return `<article><div class="schedule">${new Date(item.schedule).toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "long", hour: "2-digit", minute: "2-digit" })} · ${item.platforms.join(" + ")}</div>${media}<h2>${item.id.replaceAll("-", " ")}</h2><p>${item.caption}</p><a href="${item.url}" target="_blank">Open destination</a><div class="hold">HELD FOR YOUR APPROVAL</div></article>`;
}).join("");

fs.writeFileSync(path.join(out, "preview.html"), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Vegan Masala · Weekly content review</title><style>@font-face{font-family:Rajdhani;src:url('/fonts/Rajdhani-Medium.ttf')}@font-face{font-family:Rajdhani;src:url('/fonts/Rajdhani-Bold.ttf');font-weight:700}*{box-sizing:border-box}body{margin:0;background:#0a171d url('/images/page-background.jpg') fixed center/cover;color:#fff8e8;font-family:Rajdhani,Arial,sans-serif}.wrap{max-width:1220px;margin:auto;padding:36px}header{background:#071216e8;border:1px solid #e3bd5666;border-radius:24px;padding:28px;margin-bottom:28px}h1{margin:0;color:#e3bd56;font-size:42px}header p{font-size:20px;max-width:760px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}article{background:#071216ef;border:1px solid #e3bd5666;border-radius:22px;padding:18px}video,.carousel{width:100%;aspect-ratio:9/16;border-radius:16px;overflow:hidden;background:#101010}.carousel{aspect-ratio:1;position:relative}.carousel img{display:none;width:100%;height:100%;object-fit:cover}.carousel img.active{display:block}.carousel button{position:absolute;top:46%;border:0;border-radius:50%;width:42px;height:42px;background:#071216dd;color:#e3bd56;font-size:30px}.carousel .prev{left:12px}.carousel .next{right:12px}.carousel span{position:absolute;right:14px;bottom:12px;background:#071216dd;padding:5px 10px;border-radius:12px}.schedule{color:#e3bd56;font-weight:700;margin-bottom:10px;text-transform:uppercase}h2{text-transform:capitalize;font-size:28px;margin:14px 0 6px}article p{font-size:17px;line-height:1.45;color:#e8dfca}a{color:#e3bd56}.hold{margin-top:15px;border:1px solid #e3bd56;color:#e3bd56;border-radius:12px;text-align:center;padding:9px;font-weight:700}@media(max-width:600px){.wrap{padding:16px}h1{font-size:32px}}</style></head><body><div class="wrap"><header><h1>Weekly content review</h1><p>21–27 September 2026 · Seven scheduled ideas. Every item is locked for approval and cannot publish. Video exports begin on a fully visible branded frame; the extracted time-zero checks are saved with the batch.</p></header><main class="grid">${cards}</main></div><script>document.querySelectorAll('.carousel').forEach(c=>{let i=0;const imgs=[...c.querySelectorAll('img')],label=c.querySelector('span');function show(n){i=(n+imgs.length)%imgs.length;imgs.forEach((img,j)=>img.classList.toggle('active',j===i));label.textContent=(i+1)+' / '+imgs.length}c.querySelector('.prev').onclick=()=>show(i-1);c.querySelector('.next').onclick=()=>show(i+1)})</script></body></html>`);

console.log(`Created ${schedule.length} review-locked content pieces in ${out}`);
console.log(videoChecks.map((item) => `${item.id}: first-frame brightness ${item.mean}`).join("\n"));
