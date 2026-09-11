import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const width = 1200;
const height = 680;
const background = path.join(root, "public/images/page-background.jpg");
const logo = path.join(root, "public/brand/logo-primary.png");
const regular = path.join(root, "public/fonts/Rajdhani-Regular.ttf");
const bold = path.join(root, "public/fonts/Rajdhani-Bold.ttf");
const output = path.join(root, "public/images/social/newsletter/newsletter-dinner-plan-masthead.png");

const eyebrow = await sharp({
  text: {
    text: '<span foreground="#e3bc5b">FREE 7-DAY VEGAN INDIAN DINNER PLAN</span>',
    font: "Rajdhani",
    fontfile: bold,
    width: 900,
    height: 58,
    align: "centre",
    rgba: true,
  },
}).png().toBuffer();

const headline = await sharp({
  text: {
    text: '<span foreground="#fff7e0">MAKE SOMEONE’S\nDINNER WEEK EASIER</span>',
    font: "Rajdhani",
    fontfile: bold,
    width: 1040,
    height: 210,
    align: "centre",
    justify: false,
    rgba: true,
  },
}).png().toBuffer();

const subhead = await sharp({
  text: {
    text: '<span foreground="#e3bc5b">SEVEN DINNERS  •  ONE SHOPPING LIST  •  LESS GUESSWORK</span>',
    font: "Rajdhani",
    fontfile: regular,
    width: 980,
    height: 50,
    align: "centre",
    rgba: true,
  },
}).png().toBuffer();

const base = await sharp(background)
  .resize(width, height, { fit: "cover", position: "centre" })
  .modulate({ brightness: 0.42, saturation: 0.78 })
  .blur(0.3)
  .toBuffer();

await sharp(base)
  .composite([
    { input: { create: { width, height, channels: 4, background: "rgba(3,12,17,0.42)" } } },
    { input: await sharp(logo).resize({ width: 245 }).png().toBuffer(), top: 32, left: 478 },
    { input: { create: { width: 560, height: 2, channels: 4, background: "#d9ae4b" } }, top: 276, left: 320 },
    { input: eyebrow, top: 300, left: 150 },
    { input: headline, top: 355, left: 80 },
    { input: subhead, top: 600, left: 110 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(output);
