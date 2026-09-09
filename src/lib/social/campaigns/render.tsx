import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import satori from "satori";
import sharp from "sharp";

import { getBrandFont } from "@/lib/social/core/brand";
import { saveGeneratedInstagramImage, saveGeneratedVideo } from "@/lib/social/core/generatedAssets";
import { assertVisualDetail } from "@/lib/social/core/visualQuality";
import type { CampaignCopy } from "@/lib/social/campaigns/copy";
import type { CampaignFormat, CampaignKind, CampaignStyle } from "@/lib/social/campaigns/catalog";

const execFileAsync = promisify(execFile);
const WIDTH = 1080;
const HEIGHT = 1920;

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.vegan-masala.com").replace(/\/+$/, "");
}

async function assetBuffer(assetPath: string) {
  if (assetPath.startsWith("http")) {
    const response = await fetch(assetPath, { cache: "no-store" });
    if (!response.ok) throw new Error(`Campaign asset could not be loaded: ${assetPath}`);
    return Buffer.from(await response.arrayBuffer());
  }
  const local = path.join(process.cwd(), "public", assetPath.replace(/^\/+/, ""));
  if (fs.existsSync(local)) return fs.readFileSync(local);
  const response = await fetch(`${siteBase()}${assetPath.startsWith("/") ? "" : "/"}${assetPath}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Campaign asset could not be loaded: ${assetPath}`);
  return Buffer.from(await response.arrayBuffer());
}

function dataUrl(buffer: Buffer, mime = "image/png") {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function preparedImage(assetPath: string, width: number, height: number, minimumDetail = 10, radius = 0) {
  const buffer = await assetBuffer(assetPath);
  await assertVisualDetail(buffer, "Campaign source image", minimumDetail);
  const image = sharp(buffer).resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality: 91 });
  if (!radius) return image.toBuffer();
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
  return image.composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function preparedLogo(assetPath: string) {
  return sharp(await assetBuffer(assetPath)).resize({ width: 300, height: 170, fit: "contain" }).png().toBuffer();
}

function campaignSlug(kind: CampaignKind, sourceSlug?: string) {
  return `campaign-${kind}${sourceSlug ? `-${sourceSlug}` : ""}`.slice(0, 150);
}

export async function renderCampaignStory(copy: CampaignCopy, kind: CampaignKind, sourceSlug?: string, style: CampaignStyle = "hero") {
  const [background, hero, logo, partnerLogo] = await Promise.all([
    preparedImage("/images/page-background.jpg", WIDTH, HEIGHT, 5),
    preparedImage(copy.imagePath, 960, 1500, 10, 42),
    preparedLogo("/brand/logo-flat.png"),
    copy.partnerLogoPath ? preparedLogo(copy.partnerLogoPath) : Promise.resolve(null),
  ]);

  const svg = await satori(
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", flexDirection: "column", position: "relative", backgroundColor: "#071018", color: "white", overflow: "hidden", fontFamily: "Rajdhani" }}>
      <img src={dataUrl(background, "image/jpeg")} width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(3,8,12,.08), rgba(3,8,12,.30) 48%, rgba(3,8,12,.86) 100%)" }} />
      <div style={{ position: "absolute", inset: 28, border: "3px solid #b28a25", borderRadius: 42, display: "flex" }} />

      <div style={{ display: "flex", flexDirection: "column", padding: "70px 66px 54px", height: HEIGHT, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
          <div style={{ display: "flex", fontSize: 46, letterSpacing: 3, fontWeight: 700, color: "#f0c75e" }}>{style === "carousel-cover" ? "CAROUSEL" : style === "ingredient" ? "INGREDIENT STORY" : style === "cooking" ? "COOKING MOMENT" : "HERO RECIPE"}</div>
          <img src={dataUrl(logo)} width={220} height={125} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", width: 250, height: 3, backgroundColor: "#d9b348", marginTop: 16 }} />

        {style === "carousel-cover" ? <div style={{ display: "flex", position: "relative", height: 1200, marginTop: 90 }}>
          {[0,1,2].map((item) => <div key={item} style={{ display: "flex", position: "absolute", left: 30 + item * 205, top: item === 1 ? 0 : 100, width: 470, height: 930, padding: 16, borderRadius: 54, backgroundColor: "#090d10", border: "4px solid #d9b348", transform: `rotate(${item === 0 ? -5 : item === 2 ? 5 : 0}deg)`, zIndex: item === 1 ? 2 : 1 }}><img src={dataUrl(hero)} width={438} height={898} style={{ width: 438, height: 898, objectFit: "cover", borderRadius: 38 }} /></div>)}
          <div style={{ display: "flex", position: "absolute", left: 70, right: 70, bottom: 10, padding: "28px 34px", borderRadius: 28, backgroundColor: "rgba(3,8,12,.90)", fontSize: 54, lineHeight: 1.02, fontWeight: 700, color: "#f0c75e", zIndex: 4 }}>{copy.title}</div>
        </div> : <div style={{ display: "flex", position: "relative", width: 948, height: 1320, borderRadius: 44, overflow: "hidden", border: "3px solid #b28a25", marginTop: 42, boxShadow: "0 28px 80px rgba(0,0,0,.55)" }}>
          <img src={dataUrl(hero)} width={948} height={1320} style={{ width: 948, height: 1320, objectFit: "cover", borderRadius: 41 }} />
          <div style={{ display: "flex", position: "absolute", inset: 0, background: style === "ingredient" ? "linear-gradient(180deg, rgba(3,8,12,.05), rgba(3,8,12,.15) 55%, rgba(3,8,12,.92) 100%)" : "linear-gradient(180deg, rgba(3,8,12,.02), rgba(3,8,12,.08) 50%, rgba(3,8,12,.94) 100%)" }} />
          <div style={{ display: "flex", position: "absolute", left: 46, right: 46, bottom: 48, flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: copy.title.length > 48 ? 55 : 68, lineHeight: 1, fontWeight: 700, color: "#f0c75e" }}>{copy.title}</div>
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.18, color: "#fff", marginTop: 20 }}>{copy.hook}</div>
          </div>
        </div>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", zIndex: 5 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", backgroundColor: "#d9b348", color: "#071018", padding: "15px 25px 12px", borderRadius: 19, fontSize: 30, fontWeight: 700 }}>{copy.cta} &gt;</div>
            <div style={{ display: "flex", fontSize: 22, marginTop: 16, color: "#fff" }}>vegan-masala.com</div>
            {copy.disclosure ? <div style={{ display: "flex", fontSize: 18, marginTop: 8, color: "#d6d0c2" }}>{copy.disclosure}</div> : null}
          </div>
          {partnerLogo ? <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,.94)", borderRadius: 18, padding: "7px 14px" }}><img src={dataUrl(partnerLogo)} width={185} height={82} style={{ objectFit: "contain" }} /></div> : null}
        </div>
      </div>
    </div>,
    { width: WIDTH, height: HEIGHT, fonts: [{ name: "Rajdhani", data: getBrandFont(), weight: 700, style: "normal" }] }
  );

  const output = await sharp(Buffer.from(svg)).png().toBuffer();
  await assertVisualDetail(output, "Campaign story", 14);
  const saved = await saveGeneratedInstagramImage(campaignSlug(kind, sourceSlug), output);
  return { image: saved.url, publishImage: saved.publishUrl, storage: saved.storage, path: saved.path, buffer: output };
}

async function renderAnimatedStory(storyBuffer: Buffer, slug: string) {
  if (typeof ffmpegPath !== "string") throw new Error("Video renderer is unavailable");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vegan-campaign-"));
  const source = path.join(tempDir, "story.png");
  const output = path.join(tempDir, "story.mp4");
  fs.writeFileSync(source, storyBuffer);
  try {
    await execFileAsync(ffmpegPath, [
      "-y", "-loop", "1", "-i", source,
      "-vf", "zoompan=z='min(zoom+0.00045,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1080x1920:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=11.35:d=0.65,format=yuv420p",
      "-t", "12", "-r", "30", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-movflags", "+faststart", output,
    ]);
    const saved = await saveGeneratedVideo(slug, fs.readFileSync(output));
    return saved;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function renderCampaign(copy: CampaignCopy, kind: CampaignKind, format: CampaignFormat, sourceSlug?: string, style: CampaignStyle = "hero") {
  const story = await renderCampaignStory(copy, kind, sourceSlug, style);
  if (format === "story") return { ...story, video: "" };
  const video = await renderAnimatedStory(story.buffer, campaignSlug(kind, sourceSlug));
  return { ...story, video: video.url, videoStorage: video.storage, videoPath: video.path };
}
