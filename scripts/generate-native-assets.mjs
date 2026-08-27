import sharp from "sharp";

const source = "public/web-app-manifest-512x512.png";
const iconTarget = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
const splashTargets = [
  "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png",
  "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png",
  "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png",
];

await sharp(source)
  .resize(1024, 1024)
  .flatten({ background: "#07131d" })
  .png()
  .toFile(iconTarget);

const splashLogo = await sharp(source)
  .resize(820, 820, { fit: "contain" })
  .png()
  .toBuffer();

for (const target of splashTargets) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: "#07131d" } })
    .composite([{ input: splashLogo, gravity: "centre" }])
    .flatten({ background: "#07131d" })
    .png()
    .toFile(target);
}

console.log("Generated native app icon and splash assets.");
