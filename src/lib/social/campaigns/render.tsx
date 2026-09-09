import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import OpenAI from "openai";
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

async function recraftImage(prompt: string, reference?: Buffer, strength = 0.42) {
  const token = process.env.RECRAFT_API_TOKEN?.trim();
  if (!token) throw new Error("Recraft is not connected, so this visual style cannot be generated accurately.");
  const styleId = process.env.RECRAFT_STYLE_ID?.trim();
  const photographyGuard = "PURE PHOTOGRAPH ONLY. ZERO TEXT OR TYPOGRAPHY ANYWHERE: no words, letters, numbers, captions, labels, packaging, recipe cards, posters, signs, logos, watermarks, interfaces or decorative writing. Use only unlabelled bowls, jars and utensils.";
  const guardedPrompt = `${photographyGuard} ${prompt}`.slice(0, 710) + ` ${photographyGuard}`;
  let response: Response;
  if (reference) {
    const form = new FormData();
    const png = await sharp(reference).png().toBuffer();
    form.set("image", new Blob([new Uint8Array(png)], { type: "image/png" }), "recipe-reference.png");
    form.set("prompt", guardedPrompt.slice(0, 950));
    form.set("strength", String(strength));
    form.set("model", "recraftv3");
    if (styleId) form.set("style_id", styleId);
    response = await fetch("https://external.api.recraft.ai/v1/images/imageToImage", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  } else {
    response = await fetch("https://external.api.recraft.ai/v1/images/generations", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: guardedPrompt.slice(0, 950), model: process.env.RECRAFT_MODEL?.trim() || "recraftv4", ...(styleId ? { style_id: styleId } : {}) }),
    });
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Recraft generation failed: ${payload?.message || payload?.error || response.status}`);
  const url = payload?.data?.[0]?.url || payload?.image?.url;
  if (!url) throw new Error("Recraft returned no campaign image.");
  const download = await fetch(url, { cache: "no-store" });
  if (!download.ok) throw new Error("The generated Recraft image could not be downloaded.");
  return Buffer.from(await download.arrayBuffer());
}

async function hasCookingAction(buffer: Buffer): Promise<boolean | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-5.4",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: "Quality-check this social campaign source photograph. Return only JSON: {\"hands\":boolean,\"utensilTouchesFood\":boolean,\"panOnHob\":boolean,\"visibleCookingAction\":boolean,\"platedDishDominates\":boolean,\"containsText\":boolean}. Be strict: a spoon resting nearby is not cooking action." },
          { type: "input_image", image_url: `data:image/jpeg;base64,${buffer.toString("base64")}` },
        ],
      }] as any,
    });
    const match = response.output_text.match(/\{[\s\S]*\}/);
    if (!match) return false;
    const result = JSON.parse(match[0]);
    return Boolean(result.hands && result.utensilTouchesFood && result.panOnHob && result.visibleCookingAction && !result.platedDishDominates && !result.containsText);
  } catch {
    // Image generation belongs to Recraft. If the optional OpenAI visual
    // checker is unavailable (for example, its separate billing account has
    // no credit), do not reject a successful Recraft result.
    return null;
  }
}

async function openAiCookingFallback(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Recraft could not produce cooking action and the fallback image service is not connected.");
  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: "gpt-image-1.5",
    prompt: `Create a premium photorealistic vertical editorial cooking photograph. ${prompt} The final output is photography only with absolutely no writing, labels, logos or watermark.`,
    size: "1024x1536",
    quality: "medium",
    output_format: "jpeg",
  });
  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) throw new Error("The fallback image service returned no cooking photograph.");
  return Buffer.from(encoded, "base64");
}

async function campaignVisuals(copy: CampaignCopy, style: CampaignStyle, original: Buffer) {
  if (style === "hero" || !copy.dishName) return [original];
  const ingredients = (copy.visualIngredients || []).map((item) => item.slice(0, 42)).join(", ").slice(0, 300);
  const shared = `Premium photorealistic editorial food photography of ${copy.dishName}. Authentic vegan Indian food, dark navy patterned tile setting, warm natural light and rich realistic texture. Ingredients visible where appropriate: ${ingredients}.`;
  if (style === "cooking") {
    const action = `${copy.title}. ${copy.body}`;
    const prompt = `DOCUMENTARY PHOTOGRAPH OF HUMAN HANDS ACTIVELY COOKING. The hands and utensil are the main subject and fill the frame. An adult home cook is shown from shoulders down at a lit domestic hob: one hand firmly holds a wide pan while the other hand visibly stirs with a wooden spoon. Strong rising steam, visible utensil motion and ingredients still cooking in the pan. Verified recipe action for context: ${action}. Dark navy tiled kitchen, warm side light. NO finished dish, NO serving bowl, NO plate, NO tabletop food portrait, NO garnish shot. The result must visibly contain two human hands, a spoon touching food, a pan and an active hob.`;
    let scene = await recraftImage(prompt);
    let actionCheck = await hasCookingAction(scene);
    if (actionCheck === false) {
      scene = await recraftImage(`FAILED ATTEMPT CORRECTION: compose the camera tightly around the cook's two hands and physical stirring action. Crop out every plate and serving bowl. A wooden spoon must visibly move through food inside a pan sitting directly on a lit burner. ${prompt}`);
      actionCheck = await hasCookingAction(scene);
    }
    if (actionCheck === false) {
      scene = await openAiCookingFallback(prompt);
      actionCheck = await hasCookingAction(scene);
    }
    if (actionCheck === false) throw new Error("Neither image service produced a verifiable cooking action. No preview was saved.");
    return [await preparedBuffer(scene, 960, 1500, 42), await preparedBuffer(original, 960, 1500, 42)];
  }
  if (style === "ingredient") {
    const scene = await recraftImage(`${shared} STRICT INGREDIENT FLAT-LAY ONLY. No cooked dish, no curry, no combined mixture and no serving bowl. Show 6 to 9 actual raw ingredients from the supplied list as separate, clearly identifiable items with generous space between them: whole vegetables, loose spices in individual plain bowls, herbs and oil. Straight overhead view on one dark navy stone worktop, balanced editorial arrangement.`);
    return [await preparedBuffer(scene, 960, 1500, 42)];
  }
  const [detailView, overheadView] = await Promise.all([
    recraftImage(`${shared} SAME-DISH DETAIL VIEW. Preserve exactly the referenced recipe: identical vegetables, sauce colour, consistency, garnish, pan and dark navy tabletop. Create a tight low-angle macro crop that highlights texture and steam. Change only camera distance and angle; do not reinterpret the food or add ingredients.`, original, 0.2),
    recraftImage(`${shared} SAME-DISH OVERHEAD VIEW. Preserve exactly the referenced recipe: identical vegetables, sauce colour, consistency, garnish, pan and the same dark navy tabletop environment. Create a wider straight-down composition with subtle unlabelled serving utensils. Change only camera framing; do not reinterpret the food or add accompaniments.`, original, 0.26),
  ]);
  if (style === "collage") {
    return [
      await preparedBuffer(detailView, 960, 1500, 42),
      await preparedBuffer(original, 960, 1500, 42),
      await preparedBuffer(overheadView, 960, 1500, 42),
    ];
  }
  return [
    await preparedBuffer(detailView, 438, 898, 38),
    await preparedBuffer(original, 438, 898, 38),
    await preparedBuffer(overheadView, 438, 898, 38),
  ];
}

async function preparedBuffer(buffer: Buffer, width: number, height: number, radius = 0) {
  const image = sharp(buffer).resize(width, height, { fit: "cover", position: "centre" });
  if (!radius) return image.jpeg({ quality: 91 }).toBuffer();
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
  return image.composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

function campaignSlug(kind: CampaignKind, sourceSlug?: string) {
  return `campaign-${kind}${sourceSlug ? `-${sourceSlug}` : ""}`.slice(0, 150);
}

export async function renderCampaignStory(copy: CampaignCopy, kind: CampaignKind, sourceSlug?: string, style: CampaignStyle = "hero") {
  const [background, originalHero, logo, partnerLogo] = await Promise.all([
    preparedImage("/images/page-background.jpg", WIDTH, HEIGHT, 5),
    preparedImage(copy.imagePath, 960, 1500, 10, 42),
    preparedLogo("/brand/logo-flat.png"),
    copy.partnerLogoPath ? preparedLogo(copy.partnerLogoPath) : Promise.resolve(null),
  ]);
  const heroes = await campaignVisuals(copy, style, originalHero);
  const hero = heroes[0];

  const svg = await satori(
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", flexDirection: "column", position: "relative", backgroundColor: "#071018", color: "white", overflow: "hidden", fontFamily: "Rajdhani" }}>
      <img src={dataUrl(background, "image/jpeg")} width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(3,8,12,.08), rgba(3,8,12,.30) 48%, rgba(3,8,12,.86) 100%)" }} />
      <div style={{ position: "absolute", inset: 28, border: "3px solid #b28a25", borderRadius: 42, display: "flex" }} />

      <div style={{ display: "flex", flexDirection: "column", padding: "70px 66px 54px", height: HEIGHT, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
          <div style={{ display: "flex", fontSize: 46, letterSpacing: 3, fontWeight: 700, color: "#f0c75e" }}>{style === "carousel-cover" ? "CAROUSEL" : style === "collage" ? "RECIPE STORY" : style === "ingredient" ? "INGREDIENT STORY" : style === "cooking" ? "COOKING MOMENT" : "HERO RECIPE"}</div>
          <img src={dataUrl(logo)} width={220} height={125} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", width: 250, height: 3, backgroundColor: "#d9b348", marginTop: 16 }} />

        {style === "carousel-cover" ? <div style={{ display: "flex", position: "relative", height: 1200, marginTop: 90 }}>
          {[0,1,2].map((item) => <div key={item} style={{ display: "flex", position: "absolute", left: 30 + item * 205, top: item === 1 ? 0 : 100, width: 470, height: 930, padding: 16, borderRadius: 54, backgroundColor: "#090d10", border: "4px solid #d9b348", transform: `rotate(${item === 0 ? -5 : item === 2 ? 5 : 0}deg)`, zIndex: item === 1 ? 2 : 1 }}><img src={dataUrl(heroes[item] || hero)} width={438} height={898} style={{ width: 438, height: 898, objectFit: "cover", borderRadius: 38 }} /></div>)}
          <div style={{ display: "flex", position: "absolute", left: 70, right: 70, bottom: 10, padding: "28px 34px", borderRadius: 28, backgroundColor: "rgba(3,8,12,.90)", fontSize: 54, lineHeight: 1.02, fontWeight: 700, color: "#f0c75e", zIndex: 4 }}>{copy.title}</div>
        </div> : style === "collage" ? <div style={{ display: "flex", position: "relative", width: 948, height: 1320, marginTop: 42 }}>
          <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: 590, height: 1050, borderRadius: 42, overflow: "hidden", border: "3px solid #b28a25" }}><img src={dataUrl(heroes[1] || hero)} width={590} height={1050} style={{ width: 590, height: 1050, objectFit: "cover", borderRadius: 39 }} /></div>
          <div style={{ display: "flex", position: "absolute", right: 0, top: 65, width: 330, height: 470, borderRadius: 35, overflow: "hidden", border: "3px solid #b28a25" }}><img src={dataUrl(heroes[0] || hero)} width={330} height={470} style={{ width: 330, height: 470, objectFit: "cover", borderRadius: 32 }} /></div>
          <div style={{ display: "flex", position: "absolute", right: 0, top: 560, width: 330, height: 490, borderRadius: 35, overflow: "hidden", border: "3px solid #b28a25" }}><img src={dataUrl(heroes[2] || hero)} width={330} height={490} style={{ width: 330, height: 490, objectFit: "cover", borderRadius: 32 }} /></div>
          <div style={{ display: "flex", position: "absolute", left: 28, right: 28, bottom: 20, flexDirection: "column", padding: "28px 34px 25px", borderRadius: 28, background: "linear-gradient(90deg, rgba(0,0,0,.97), rgba(0,0,0,.78))" }}><div style={{ display: "flex", fontSize: 56, lineHeight: 1, fontWeight: 700, color: "#f0c75e" }}>{copy.title}</div><div style={{ display: "flex", fontSize: 28, lineHeight: 1.16, color: "#fff", marginTop: 15 }}>{copy.hook}</div></div>
        </div> : <div style={{ display: "flex", position: "relative", width: 948, height: 1320, borderRadius: 44, overflow: "hidden", border: "3px solid #b28a25", marginTop: 42, boxShadow: "0 28px 80px rgba(0,0,0,.55)" }}>
          <img src={dataUrl(hero)} width={948} height={1320} style={{ width: 948, height: 1320, objectFit: "cover", borderRadius: 41 }} />
          {style === "cooking" && heroes[1] ? <div style={{ display: "flex", position: "absolute", right: 34, top: 34, width: 285, height: 365, padding: 9, borderRadius: 28, backgroundColor: "#071018", border: "3px solid #d9b348", boxShadow: "0 16px 40px rgba(0,0,0,.55)" }}><img src={dataUrl(heroes[1])} width={267} height={347} style={{ width: 267, height: 347, objectFit: "cover", borderRadius: 19 }} /></div> : null}
          <div style={{ display: "flex", position: "absolute", inset: 0, background: style === "ingredient" ? "linear-gradient(180deg, rgba(3,8,12,.05), rgba(3,8,12,.15) 55%, rgba(3,8,12,.92) 100%)" : "linear-gradient(180deg, rgba(3,8,12,.02), rgba(3,8,12,.08) 50%, rgba(3,8,12,.94) 100%)" }} />
          <div style={{ display: "flex", position: "absolute", left: 30, right: 30, bottom: 30, flexDirection: "column", padding: "30px 34px 27px", borderRadius: 28, background: "linear-gradient(90deg, rgba(0,0,0,.97), rgba(0,0,0,.82) 72%, rgba(0,0,0,.60))" }}>
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
