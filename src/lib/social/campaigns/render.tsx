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
import type { CampaignFormat, CampaignKind } from "@/lib/social/campaigns/catalog";

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

async function preparedImage(assetPath: string, width: number, height: number, minimumDetail = 10) {
  const buffer = await assetBuffer(assetPath);
  await assertVisualDetail(buffer, "Campaign source image", minimumDetail);
  return sharp(buffer).resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality: 91 }).toBuffer();
}

async function preparedLogo(assetPath: string) {
  return sharp(await assetBuffer(assetPath)).resize({ width: 300, height: 170, fit: "contain" }).png().toBuffer();
}

function campaignSlug(kind: CampaignKind, sourceSlug?: string) {
  return `campaign-${kind}${sourceSlug ? `-${sourceSlug}` : ""}`.slice(0, 150);
}

export async function renderCampaignStory(copy: CampaignCopy, kind: CampaignKind, sourceSlug?: string) {
  const teachingLayout = kind === "ingredient" || kind === "technique" || kind === "mistake";
  const processLayout = kind === "behind-the-recipe";
  const [background, hero, logo, partnerLogo] = await Promise.all([
    preparedImage("/images/page-background.jpg", WIDTH, HEIGHT, 5),
    preparedImage(copy.imagePath, 900, 700),
    preparedLogo("/brand/logo-flat.png"),
    copy.partnerLogoPath ? preparedLogo(copy.partnerLogoPath) : Promise.resolve(null),
  ]);

  const svg = await satori(
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", flexDirection: "column", position: "relative", backgroundColor: "#071018", color: "white", overflow: "hidden", fontFamily: "Rajdhani" }}>
      <img src={dataUrl(background, "image/jpeg")} width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(3,8,12,.08), rgba(3,8,12,.30) 48%, rgba(3,8,12,.86) 100%)" }} />
      <div style={{ position: "absolute", inset: 28, border: "3px solid #b28a25", borderRadius: 42, display: "flex" }} />

      <div style={{ display: "flex", flexDirection: "column", padding: "82px 78px 58px", height: HEIGHT, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", backgroundColor: "#9d3131", borderRadius: 30, padding: "14px 26px 11px", fontSize: 25, letterSpacing: 3.2, fontWeight: 700 }}>{copy.eyebrow}</div>
          {partnerLogo ? <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,.94)", borderRadius: 22, padding: "8px 18px" }}><img src={dataUrl(partnerLogo)} width={190} height={90} style={{ objectFit: "contain" }} /></div> : null}
        </div>

        <div style={{ display: "flex", fontSize: copy.title.length > 52 ? 66 : 78, lineHeight: 0.98, fontWeight: 700, color: "#e0b83e", marginTop: 44, maxWidth: 900 }}>{copy.title}</div>

        {teachingLayout ? (
          <div style={{ display: "flex", flexDirection: "row", gap: 42, marginTop: 54, alignItems: "center" }}>
            <div style={{ display: "flex", width: 535, height: 720, borderRadius: 38, overflow: "hidden", border: "3px solid #b28a25", boxShadow: "0 24px 70px rgba(0,0,0,.48)" }}>
              <img src={dataUrl(hero, "image/jpeg")} width={535} height={720} style={{ width: 535, height: 720, objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", width: 320, flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 42, lineHeight: 1.05, fontWeight: 700, color: "#e0b83e" }}>{copy.hook}</div>
              <div style={{ display: "flex", fontSize: 29, lineHeight: 1.2, color: "#f4f1e8", marginTop: 28 }}>{copy.body}</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", width: 900, height: processLayout ? 820 : 700, borderRadius: 38, overflow: "hidden", border: "3px solid #b28a25", marginTop: 44, boxShadow: "0 24px 70px rgba(0,0,0,.48)" }}>
              <img src={dataUrl(hero, "image/jpeg")} width={900} height={processLayout ? 820 : 700} style={{ width: 900, height: processLayout ? 820 : 700, objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: processLayout ? 34 : 48, maxWidth: 890 }}>
              <div style={{ display: "flex", fontSize: processLayout ? 39 : 45, lineHeight: 1.08, fontWeight: 700, color: "#e0b83e" }}>{copy.hook}</div>
              <div style={{ display: "flex", fontSize: 31, lineHeight: 1.22, color: "#f4f1e8", marginTop: 24 }}>{copy.body}</div>
            </div>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", backgroundColor: "#d9b348", color: "#071018", padding: "15px 25px 12px", borderRadius: 19, fontSize: 30, fontWeight: 700 }}>{copy.cta} &gt;</div>
            <div style={{ display: "flex", fontSize: 22, marginTop: 16, color: "#fff" }}>vegan-masala.com</div>
            {copy.disclosure ? <div style={{ display: "flex", fontSize: 18, marginTop: 8, color: "#d6d0c2" }}>{copy.disclosure}</div> : null}
          </div>
          <img src={dataUrl(logo)} width={240} height={140} style={{ objectFit: "contain" }} />
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

export async function renderCampaign(copy: CampaignCopy, kind: CampaignKind, format: CampaignFormat, sourceSlug?: string) {
  const story = await renderCampaignStory(copy, kind, sourceSlug);
  if (format === "story") return { ...story, video: "" };
  const video = await renderAnimatedStory(story.buffer, campaignSlug(kind, sourceSlug));
  return { ...story, video: video.url, videoStorage: video.storage, videoPath: video.path };
}
