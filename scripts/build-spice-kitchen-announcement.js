const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "public", "social", "spice-kitchen-affiliate-announcement.jpg");

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char]);

async function main() {
  const background = await sharp(path.join(root, "public", "images", "page-background.jpg"))
    .resize(1080, 1080, { fit: "cover" })
    .modulate({ brightness: 0.72, saturation: 0.8 })
    .jpeg({ quality: 92 })
    .toBuffer();
  const veganLogo = await sharp(path.join(root, "public", "brand", "logo-primary.png"))
    .resize({ width: 205, height: 180, fit: "contain" }).png().toBuffer();
  const partnerLogo = await sharp(path.join(root, "public", "images", "affiliates", "spice-kitchen-logo.png"))
    .resize({ width: 150, height: 150, fit: "contain" }).png().toBuffer();
  const product = await sharp(path.join(root, "public", "images", "affiliates", "spice-kitchen-indian-spice-tin.png"))
    .resize({ width: 440, height: 440, fit: "contain" }).png().toBuffer();

  const overlay = Buffer.from(`
    <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="26" width="1028" height="1028" rx="44" fill="#08131a" fill-opacity="0.84" stroke="#d9ad43" stroke-width="3"/>
      <rect x="62" y="60" width="956" height="188" rx="30" fill="#0d1b22" stroke="#d9ad43" stroke-opacity="0.55"/>
      <text x="540" y="305" text-anchor="middle" fill="#f5efe1" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="4">NOW AFFILIATED WITH</text>
      <text x="540" y="363" text-anchor="middle" fill="#dfb63f" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="800">SPICE KITCHEN</text>
      <rect x="72" y="410" width="936" height="444" rx="36" fill="#071016" stroke="#d9ad43" stroke-width="2"/>
      <text x="540" y="912" text-anchor="middle" fill="#f5efe1" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Bold flavours for adventurous cooks</text>
      <text x="540" y="958" text-anchor="middle" fill="#c9c3b8" font-family="Arial, Helvetica, sans-serif" font-size="23">Discover our recommended Indian spices and blends</text>
      <text x="540" y="1005" text-anchor="middle" fill="#dfb63f" font-family="Arial, Helvetica, sans-serif" font-size="20">Affiliate partnership · vegan-masala.com</text>
    </svg>`);

  await sharp(background)
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: veganLogo, left: 205, top: 64 },
      { input: partnerLogo, left: 725, top: 79 },
      { input: product, left: 320, top: 410 },
    ])
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(output);

  console.log(output);
}

main().catch((error) => {
  console.error(escapeXml(error?.stack || error));
  process.exitCode = 1;
});
