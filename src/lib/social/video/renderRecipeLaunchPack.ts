import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import opentype from "opentype.js";
import sharp from "sharp";

import { createLocalJobId, localJobDirectory } from "./renderLocalFootage";

const execFileAsync = promisify(execFile);

export type LaunchOutputId = "full" | "reel" | "pinterest" | "technique" | "tempering" | "reveal";

export type LaunchRenderResult = {
  id: LaunchOutputId;
  label: string;
  fileName: string;
  previewUrl: string;
  width: number;
  height: number;
  duration: number;
};

type Cue = { start: number; end: number; text: string };
type Segment = { start: number; end: number };

const FONT = path.join(process.cwd(), "public", "fonts", "Rajdhani-Bold.ttf");
const MUSIC = path.join(process.cwd(), "public", "audio", "vegan-masala-bed.mp3");
const END_DURATION = 3;

function executable(name: "ffmpeg" | "ffprobe") {
  const candidates = [`/opt/homebrew/bin/${name}`, `/usr/local/bin/${name}`];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`${name} is not installed on this Mac.`);
  return found;
}

async function run(args: string[]) {
  await execFileAsync(executable("ffmpeg"), args, { maxBuffer: 16 * 1024 * 1024 });
}

async function probe(filePath: string) {
  const { stdout } = await execFileAsync(executable("ffprobe"), [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,width,height",
    "-of", "json",
    filePath,
  ]);
  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
  };
  const video = parsed.streams?.find((stream) => stream.codec_type === "video");
  return {
    duration: Number(parsed.format?.duration || 0),
    width: Number(video?.width || 0),
    height: Number(video?.height || 0),
    hasAudio: Boolean(parsed.streams?.some((stream) => stream.codec_type === "audio")),
  };
}

function safePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "recipe";
}

function allowedPackDirectory(value: string) {
  const resolved = path.resolve(value.trim());
  const roots = [path.join(os.homedir(), "Desktop"), path.join(os.homedir(), "Documents")];
  if (!roots.some((root) => resolved === root || resolved.startsWith(`${root}${path.sep}`))) {
    throw new Error("Choose a publishing-pack folder inside your Desktop or Documents folder.");
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error("The publishing-pack folder could not be found on this Mac.");
  }
  return resolved;
}

function timestamp(value: string) {
  const match = value.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

function parseSrt(filePath: string): Cue[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").filter(Boolean);
      const timingIndex = lines.findIndex((line) => line.includes("-->"));
      if (timingIndex < 0) return null;
      const [start, end] = lines[timingIndex].split("-->");
      return {
        start: timestamp(start),
        end: timestamp(end),
        text: lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      };
    })
    .filter((cue): cue is Cue => Boolean(cue && cue.end > cue.start && cue.text));
}

function uniqueActionCues(cues: Cue[]) {
  const result: Cue[] = [];
  for (const cue of cues) {
    if (/^(ingredients|finished dish)$/i.test(cue.text.trim())) continue;
    if (result[result.length - 1]?.text.toLowerCase() === cue.text.toLowerCase()) continue;
    result.push(cue);
  }
  return result;
}

function evenlySample<T>(items: T[], count: number) {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, index) => items[Math.round(index * (items.length - 1) / (count - 1))]);
}

function clipFromCue(cue: Cue, seconds: number, totalDuration: number): Segment {
  const available = Math.max(0.5, cue.end - cue.start);
  const duration = Math.min(seconds, available);
  const start = Math.min(Math.max(0, cue.start + Math.min(1, available * 0.08)), Math.max(0, totalDuration - duration));
  return { start, end: Math.min(totalDuration, start + duration) };
}

function summarySegments(cues: Cue[], totalDuration: number, target: 90 | 45): Segment[] {
  const actionCount = target === 90 ? 9 : 8;
  const parsedActions = evenlySample(uniqueActionCues(cues), actionCount);
  const actions = parsedActions.length
    ? parsedActions
    : Array.from({ length: actionCount }, (_, index) => {
        const start = totalDuration * (index + 1) / (actionCount + 2);
        return { start, end: Math.min(totalDuration, start + 12), text: `Recipe stage ${index + 1}` };
      });
  const introDuration = target === 90 ? 6 : 4;
  const finalDuration = target === 90 ? 12 : 5;
  const actionDuration = (target - introDuration - finalDuration) / Math.max(1, actions.length);
  const segments = [
    { start: 0, end: Math.min(introDuration, totalDuration) },
    ...actions.map((cue) => clipFromCue(cue, actionDuration, totalDuration)),
    { start: Math.max(0, totalDuration - finalDuration), end: totalDuration },
  ];
  return segments.filter((segment) => segment.end - segment.start > 0.25);
}

function featuredCue(cues: Cue[], expression: RegExp, fallbackIndex: number) {
  const actions = uniqueActionCues(cues);
  return actions.find((cue) => expression.test(cue.text)) || actions[Math.min(fallbackIndex, Math.max(0, actions.length - 1))];
}

function textPath(text: string, fontSize: number, centerX: number, baseline: number) {
  const font = opentype.loadSync(FONT);
  const width = font.getAdvanceWidth(text, fontSize);
  return font.getPath(text, centerX - width / 2, baseline, fontSize).toPathData(2);
}

async function createEndCard(input: string, output: string, width: number, height: number) {
  const frame = output.replace(/\.[^.]+$/i, "-source.jpg");
  await run(["-y", "-ss", "0.8", "-i", input, "-frames:v", "1", frame]);
  const vertical = height > width;
  const panelX = Math.round(width * (vertical ? 0.1 : 0.13));
  const panelY = Math.round(height * (vertical ? 0.69 : 0.72));
  const panelWidth = Math.round(width * (vertical ? 0.8 : 0.74));
  const panelHeight = Math.round(height * (vertical ? 0.21 : 0.18));
  const headlineSize = Math.max(42, Math.round(width * (vertical ? 0.055 : 0.035)));
  const addressSize = Math.max(36, Math.round(width * (vertical ? 0.05 : 0.032)));
  const headlineBaseline = panelY + Math.round(panelHeight * 0.43);
  const addressBaseline = panelY + Math.round(panelHeight * 0.74);
  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="${Math.round(width * 0.018)}" fill="#061116"/>
      <path d="${textPath("SEE COMPLETE RECIPE AT", headlineSize, width / 2, headlineBaseline)}" fill="#FFFFFF"/>
      <path d="${textPath("WWW.VEGAN-MASALA.COM", addressSize, width / 2, addressBaseline)}" fill="#E1B84B"/>
    </svg>
  `);
  await sharp(frame)
    .resize(width, height, { fit: "fill" })
    .composite([{ input: overlay, left: 0, top: 0 }])
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(output);
  fs.rmSync(frame, { force: true });
}

async function endCardVideo(card: string, output: string, width: number, height: number, audioOffset: number) {
  await run([
    "-y",
    "-loop", "1", "-t", String(END_DURATION), "-i", card,
    "-ss", String(Math.max(0, audioOffset)), "-i", MUSIC,
    "-map", "0:v:0", "-map", "1:a:0",
    "-vf", `scale=${width}:${height},fps=30,format=yuv420p`,
    "-af", `volume=0.45,afade=t=out:st=${END_DURATION - 0.8}:d=0.8`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
    "-t", String(END_DURATION), "-shortest", output,
  ]);
}

async function addMusic(source: string, output: string, duration: number) {
  const sourceInfo = await probe(source);
  if (sourceInfo.hasAudio) {
    await run(["-y", "-i", source, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", output]);
    return;
  }
  await run([
    "-y", "-i", source, "-stream_loop", "-1", "-i", MUSIC,
    "-map", "0:v:0", "-map", "1:a:0", "-filter:a", "volume=0.45",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
    "-t", String(duration), "-movflags", "+faststart", output,
  ]);
}

async function renderSequence(source: string, output: string, segments: Segment[]) {
  const filterParts = segments.map((segment, index) =>
    `[0:v]trim=start=${segment.start}:end=${segment.end},setpts=PTS-STARTPTS[v${index}]`,
  );
  const concat = `${segments.map((_, index) => `[v${index}]`).join("")}concat=n=${segments.length}:v=1:a=0[v]`;
  const duration = segments.reduce((sum, segment) => sum + segment.end - segment.start, 0);
  await run([
    "-y", "-i", source, "-stream_loop", "-1", "-i", MUSIC,
    "-filter_complex", `${filterParts.join(";")};${concat}`,
    "-map", "[v]", "-map", "1:a:0", "-filter:a", "volume=0.45",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
    "-t", String(duration), "-movflags", "+faststart", output,
  ]);
}

async function appendCard(main: string, card: string, output: string) {
  const mainInfo = await probe(main);
  const cardVideo = output.replace(/\.mp4$/i, "-end.mp4");
  await endCardVideo(card, cardVideo, mainInfo.width, mainInfo.height, mainInfo.duration % 253.584);
  const concat = output.replace(/\.mp4$/i, "-concat.txt");
  fs.writeFileSync(concat, `file '${main.replace(/'/g, "'\\''")}'\nfile '${cardVideo.replace(/'/g, "'\\''")}'\n`);
  await run(["-y", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", "-movflags", "+faststart", output]);
  fs.rmSync(cardVideo, { force: true });
  fs.rmSync(concat, { force: true });
}

export async function renderRecipeLaunchPack(options: { packDirectory: string; slug: string; title: string }) {
  if (!fs.existsSync(FONT)) throw new Error("The Rajdhani brand font is missing.");
  if (!fs.existsSync(MUSIC)) throw new Error("The Vegan Masala music bed is missing.");

  const packDirectory = allowedPackDirectory(options.packDirectory);
  const landscape = path.join(packDirectory, "video-16x9.mp4");
  const vertical = path.join(packDirectory, "video-9x16.mp4");
  const captions = path.join(packDirectory, "captions.srt");
  if (!fs.existsSync(landscape) || !fs.existsSync(vertical)) {
    throw new Error("The folder must contain video-16x9.mp4 and video-9x16.mp4.");
  }

  const landscapeInfo = await probe(landscape);
  const verticalInfo = await probe(vertical);
  const cues = parseSrt(captions);
  const jobId = createLocalJobId(`${options.slug}-launch`);
  const directory = localJobDirectory(jobId);
  const working = path.join(directory, "working");
  const outputDirectory = path.join(directory, "output");
  fs.mkdirSync(working, { recursive: true });
  fs.mkdirSync(outputDirectory, { recursive: true });

  const landscapeCard = path.join(working, "end-card-16x9.jpg");
  const verticalCard = path.join(working, "end-card-9x16.jpg");
  await createEndCard(landscape, landscapeCard, landscapeInfo.width, landscapeInfo.height);
  await createEndCard(vertical, verticalCard, verticalInfo.width, verticalInfo.height);

  const renderDefinitions: Array<{
    id: LaunchOutputId;
    label: string;
    source: string;
    card: string;
    segments?: Segment[];
  }> = [
    { id: "full", label: "Full YouTube / Facebook video", source: landscape, card: landscapeCard },
    { id: "reel", label: "90-second Instagram / Facebook / TikTok edit", source: vertical, card: verticalCard, segments: summarySegments(cues, verticalInfo.duration, 90) },
    { id: "pinterest", label: "45-second Pinterest video Pin", source: vertical, card: verticalCard, segments: summarySegments(cues, verticalInfo.duration, 45) },
  ];

  const technique = featuredCue(cues, /(ginger|garlic|spice|masala|turmeric|coriander|paprika)/i, 4);
  const tempering = featuredCue(cues, /(temper|tadka|cumin|bay leaf)/i, Math.max(0, uniqueActionCues(cues).length - 2));
  const techniqueSegment = technique
    ? clipFromCue(technique, 35, verticalInfo.duration)
    : { start: verticalInfo.duration * 0.4, end: Math.min(verticalInfo.duration, verticalInfo.duration * 0.4 + 35) };
  const temperingSegment = tempering
    ? clipFromCue(tempering, 40, verticalInfo.duration)
    : { start: verticalInfo.duration * 0.7, end: Math.min(verticalInfo.duration, verticalInfo.duration * 0.7 + 40) };
  renderDefinitions.push({ id: "technique", label: "Technique follow-up", source: vertical, card: verticalCard, segments: [techniqueSegment] });
  renderDefinitions.push({ id: "tempering", label: "Tempering follow-up", source: vertical, card: verticalCard, segments: [temperingSegment] });
  renderDefinitions.push({ id: "reveal", label: "Finished-dish reminder", source: vertical, card: verticalCard, segments: [{ start: Math.max(0, verticalInfo.duration - 20), end: verticalInfo.duration }] });

  const results: LaunchRenderResult[] = [];
  for (const definition of renderDefinitions) {
    const base = path.join(working, `${definition.id}-main.mp4`);
    if (definition.segments?.length) await renderSequence(definition.source, base, definition.segments);
    else await addMusic(definition.source, base, landscapeInfo.duration);
    const fileName = `${safePart(options.slug)}-${definition.id}.mp4`;
    const localPath = path.join(outputDirectory, fileName);
    await appendCard(base, definition.card, localPath);
    const info = await probe(localPath);
    results.push({
      id: definition.id,
      label: definition.label,
      fileName,
      previewUrl: `/api/admin/social/production/file?job=${encodeURIComponent(jobId)}&name=${encodeURIComponent(fileName)}`,
      width: info.width,
      height: info.height,
      duration: info.duration,
    });
  }

  fs.writeFileSync(path.join(directory, "job.json"), JSON.stringify({ ...options, packDirectory, results }, null, 2));
  return { jobId, results, captionsFound: cues.length > 0 };
}
