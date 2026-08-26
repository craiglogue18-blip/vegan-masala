#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = process.cwd();
const outputDir = path.join(root, "public", "videos");
const images = [
  "public/images/recipes/vegan-chicken-madras.png",
  "public/images/recipes/tarka-dal.png",
  "public/images/recipes/onion-bhaji.png",
  "public/images/recipes/vegan-garlic-naan.png",
  "public/images/recipes/veg-biryani-vegetable-biryani-recipe.png",
  "public/images/recipes/vegan-chicken-madras.png",
].map((file) => path.join(root, file));

fs.mkdirSync(outputDir, { recursive: true });

function build(name, width, height) {
  const output = path.join(outputDir, name);
  const args = images.flatMap((image) => ["-loop", "1", "-t", "2", "-i", image]);
  const clips = images.map(
    (_, index) =>
      `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,zoompan=z='min(zoom+0.00065,1.07)':d=60:s=${width}x${height}:fps=30,format=yuv420p[v${index}]`
  );
  const fades = [
    "[v0][v1]xfade=transition=fade:duration=0.5:offset=1.5[x1]",
    "[x1][v2]xfade=transition=fade:duration=0.5:offset=3[x2]",
    "[x2][v3]xfade=transition=fade:duration=0.5:offset=4.5[x3]",
    "[x3][v4]xfade=transition=fade:duration=0.5:offset=6[x4]",
    "[x4][v5]xfade=transition=fade:duration=0.5:offset=7.5[out]",
  ];

  const result = spawnSync(
    ffmpegPath,
    [
      "-y",
      ...args,
      "-filter_complex",
      [...clips, ...fades].join(";"),
      "-map",
      "[out]",
      "-t",
      "9.5",
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "medium",
      "-crf",
      "25",
      "-movflags",
      "+faststart",
      output,
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0) process.exit(result.status || 1);
}

build("home-hero-desktop.mp4", 960, 1080);
build("home-hero-mobile.mp4", 720, 900);
