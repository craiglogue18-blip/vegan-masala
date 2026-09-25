import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import opentype from "opentype.js";

const execFileAsync = promisify(execFile);

export type LocalOutputId = "recipe" | "youtube" | "reel" | "short" | "tiktok" | "pinterest";

export type LocalSource = {
  slot: string;
  order: number;
  path: string;
  originalName: string;
  mime: string;
  caption: string;
};

export type LocalRenderResult = {
  id: LocalOutputId;
  label: string;
  fileName: string;
  localPath: string;
  previewUrl: string;
  width: number;
  height: number;
};

const OUTPUTS: Record<LocalOutputId, { width: number; height: number; label: string }> = {
  recipe: { width: 1920, height: 1080, label: "Recipe-page method" },
  youtube: { width: 1920, height: 1080, label: "YouTube recipe" },
  reel: { width: 1080, height: 1920, label: "Instagram / Facebook Reel" },
  short: { width: 1080, height: 1920, label: "YouTube Short" },
  tiktok: { width: 1080, height: 1920, label: "TikTok" },
  pinterest: { width: 1000, height: 1500, label: "Pinterest video Pin" },
};

const ROOT = path.join(process.cwd(), "generated", "raw-footage-studio");
const FONT = path.join(process.cwd(), "public", "fonts", "Rajdhani-Bold.ttf");
const LOGO = path.join(process.cwd(), "public", "brand", "logo-mark.png");

function ensureDirectory(directory: string) {
  fs.mkdirSync(directory, { recursive: true });
}

function ffmpegPath() {
  const candidates = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("FFmpeg is not installed on this Mac.");
  return found;
}

function ffprobePath() {
  const candidates = ["/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe"];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("FFprobe is not installed on this Mac.");
  return found;
}

function safePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "video";
}

async function run(args: string[]) {
  await execFileAsync(ffmpegPath(), args, { maxBuffer: 8 * 1024 * 1024 });
}

async function hasAudio(filePath: string) {
  try {
    const { stdout } = await execFileAsync(ffprobePath(), [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=codec_type",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    return stdout.trim() === "audio";
  } catch {
    return false;
  }
}

function clipDuration(template: string, isImage: boolean) {
  if (isImage) return template === "complete" ? 4 : 2.5;
  if (template === "complete") return 12;
  if (template === "quick") return 3;
  return 4.5;
}

function textPath(text: string, fontSize: number, centerX: number, baseline: number) {
  const font = opentype.loadSync(FONT);
  const width = font.getAdvanceWidth(text, fontSize);
  return font.getPath(text, centerX - width / 2, baseline, fontSize).toPathData(2);
}

function wrapForWidth(text: string, fontSize: number, maxWidth: number) {
  const font = opentype.loadSync(FONT);
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || font.getAdvanceWidth(candidate, fontSize) <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= 2) return lines;
  const shortened = lines.slice(0, 2);
  shortened[1] = `${shortened[1].replace(/[.,:;!?…-]+$/, "")}…`;
  return shortened;
}

async function createBrandOverlay(outputPath: string, width: number, height: number, title: string) {
  const titleSize = Math.max(34, Math.round(width * 0.044));
  const labelSize = Math.max(20, Math.round(width * 0.021));
  const lowerPanel = Math.round(height * 0.17);
  const titleLines = wrapForWidth(title.toUpperCase(), titleSize, width * 0.84);
  const titleBaseline = height - Math.round(lowerPanel * (titleLines.length > 1 ? 0.66 : 0.58));
  const labelBaseline = height - Math.round(lowerPanel * 0.2);
  const lineGap = Math.round(titleSize * 1.04);
  const titlePaths = titleLines
    .map((line, index) => `<path d="${textPath(line, titleSize, width / 2, titleBaseline + index * lineGap)}" fill="#E1B84B"/>`)
    .join("");
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${height - lowerPanel}" width="${width}" height="${lowerPanel}" fill="#000" fill-opacity="0.78"/>
      <rect x="0" y="${height - lowerPanel}" width="${width}" height="4" fill="#E1B84B"/>
      ${titlePaths}
      <path d="${textPath("VEGAN-MASALA.COM", labelSize, width / 2, labelBaseline)}" fill="#FFFFFF"/>
    </svg>
  `);
  const logoWidth = Math.max(62, Math.round(width * 0.085));
  const logo = await sharp(LOGO).resize({ width: logoWidth }).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: svg, left: 0, top: 0 },
      { input: logo, left: width - logoWidth - Math.round(width * 0.035), top: Math.round(width * 0.035) },
    ])
    .png()
    .toFile(outputPath);
}

async function makeSegment(options: {
  source: LocalSource;
  outputPath: string;
  width: number;
  height: number;
  title: string;
  template: string;
  overlayPath: string;
}) {
  const { source, outputPath, width, height, template, overlayPath } = options;
  const isImage = source.mime.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(source.originalName);
  const duration = clipDuration(template, isImage);
  const audio = !isImage && (await hasAudio(source.path));
  const args = ["-y"];

  if (isImage) args.push("-loop", "1", "-t", String(duration), "-i", source.path);
  else args.push("-i", source.path, "-t", String(duration));
  args.push("-i", overlayPath);

  if (!audio) args.push("-f", "lavfi", "-t", String(duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");

  args.push(
    "-filter_complex", `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=30[base];[base][1:v]overlay=0:0:format=auto,format=yuv420p[v]`,
    "-map", "[v]",
    "-map", audio ? "0:a:0" : "2:a:0",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-c:a", "aac",
    "-b:a", "160k",
    "-ar", "48000",
    "-ac", "2",
    "-movflags", "+faststart",
    "-shortest",
    outputPath,
  );

  await run(args);
}

async function makeEndCard(outputPath: string, width: number, height: number, title: string) {
  const titleSize = Math.max(42, Math.round(width * 0.06));
  const bodySize = Math.max(25, Math.round(width * 0.03));
  const cardPath = outputPath.replace(/\.mp4$/i, ".png");
  const titleBaseline = height / 2 - Math.round(height * 0.02);
  const bodyBaseline = height / 2 + Math.round(height * 0.08);
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#07131B"/>
      <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.08)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.84)}" rx="${Math.round(width * 0.04)}" fill="none" stroke="#E1B84B" stroke-width="4"/>
      <path d="${textPath(title.toUpperCase(), titleSize, width / 2, titleBaseline)}" fill="#E1B84B"/>
      <path d="${textPath("FULL RECIPE AT VEGAN-MASALA.COM", bodySize, width / 2, bodyBaseline)}" fill="#FFFFFF"/>
    </svg>
  `);
  const logoWidth = Math.max(130, Math.round(width * 0.2));
  const logo = await sharp(LOGO).resize({ width: logoWidth }).png().toBuffer();
  await sharp(svg)
    .composite([{ input: logo, left: Math.round((width - logoWidth) / 2), top: Math.round(height * 0.15) }])
    .png()
    .toFile(cardPath);

  await run([
    "-y",
    "-loop", "1", "-t", "2", "-i", cardPath,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-vf", "format=yuv420p",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-c:a", "aac",
    "-t", "2",
    "-shortest",
    outputPath,
  ]);
}

export function createLocalJobId(slug: string) {
  return `${Date.now().toString(36)}-${safePart(slug)}`;
}

export function localJobDirectory(jobId: string) {
  return path.join(ROOT, safePart(jobId));
}

export async function renderLocalFootage(options: {
  jobId: string;
  slug: string;
  title: string;
  template: string;
  outputs: LocalOutputId[];
  sources: LocalSource[];
}) {
  if (!options.sources.length) throw new Error("Add at least one video clip or photograph before rendering.");
  if (!options.outputs.length) throw new Error("Choose at least one output format.");
  if (!fs.existsSync(FONT)) throw new Error("Rajdhani brand font is missing.");

  const jobDirectory = localJobDirectory(options.jobId);
  const workingDirectory = path.join(jobDirectory, "working");
  const outputDirectory = path.join(jobDirectory, "output");
  ensureDirectory(workingDirectory);
  ensureDirectory(outputDirectory);

  const slotRank = (slot: string) => {
    if (slot === "finished") return 0;
    if (slot === "presenter") return 10_000;
    const match = slot.match(/^step-(\d+)$/);
    return match ? Number(match[1]) : 9_000;
  };
  const orderedSources = [...options.sources].sort((left, right) => {
    const leftSlot = slotRank(left.slot);
    const rightSlot = slotRank(right.slot);
    return leftSlot === rightSlot ? left.order - right.order : leftSlot - rightSlot;
  });

  const selectSources = (outputId: LocalOutputId) => {
    const isShort = ["reel", "short", "tiktok", "pinterest"].includes(outputId);
    if (!isShort || orderedSources.length <= 8) return orderedSources;
    const selected = new Set<number>([0, orderedSources.length - 1]);
    for (let index = 1; selected.size < 8; index += 1) {
      selected.add(Math.round((index * (orderedSources.length - 1)) / 7));
    }
    return [...selected].sort((a, b) => a - b).map((index) => orderedSources[index]);
  };

  const results: LocalRenderResult[] = [];
  for (const outputId of options.outputs) {
    const format = OUTPUTS[outputId];
    if (!format) continue;
    const formatWork = path.join(workingDirectory, outputId);
    ensureDirectory(formatWork);
    const segments: string[] = [];
    const outputSources = selectSources(outputId);

    for (let index = 0; index < outputSources.length; index += 1) {
      const segment = path.join(formatWork, `segment-${String(index).padStart(3, "0")}.mp4`);
      const overlayPath = path.join(formatWork, `brand-overlay-${String(index).padStart(3, "0")}.png`);
      await createBrandOverlay(overlayPath, format.width, format.height, outputSources[index].caption || options.title);
      await makeSegment({
        source: outputSources[index],
        outputPath: segment,
        width: format.width,
        height: format.height,
        title: options.title,
        template: options.template,
        overlayPath,
      });
      segments.push(segment);
    }

    const endCard = path.join(formatWork, "segment-end.mp4");
    await makeEndCard(endCard, format.width, format.height, options.title);
    segments.push(endCard);

    const concatFile = path.join(formatWork, "concat.txt");
    fs.writeFileSync(concatFile, segments.map((segment) => `file '${segment.replace(/'/g, "'\\''")}'`).join("\n"));
    const fileName = `${safePart(options.slug)}-${outputId}.mp4`;
    const localPath = path.join(outputDirectory, fileName);
    await run(["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", "-movflags", "+faststart", localPath]);

    results.push({
      id: outputId,
      label: format.label,
      fileName,
      localPath,
      previewUrl: `/api/admin/social/production/file?job=${encodeURIComponent(options.jobId)}&name=${encodeURIComponent(fileName)}`,
      width: format.width,
      height: format.height,
    });
  }

  fs.writeFileSync(path.join(jobDirectory, "job.json"), JSON.stringify({ ...options, sources: orderedSources, results }, null, 2));
  return results;
}

export function resolveLocalRender(jobId: string, fileName: string) {
  const safeJob = safePart(jobId);
  const safeFile = path.basename(fileName);
  const target = path.join(ROOT, safeJob, "output", safeFile);
  const expectedRoot = path.join(ROOT, safeJob, "output") + path.sep;
  if (!target.startsWith(expectedRoot)) throw new Error("Invalid local render path.");
  return target;
}
