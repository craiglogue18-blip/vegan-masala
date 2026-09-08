import { detectContentTypeBySlug } from "@/lib/social/core/content";
import { generateSocialCopyForSlug } from "@/lib/social/ai/generateSocialCopy";
import {
  buildInstagramCaption,
  buildInstagramCaptionVariants,
  buildFacebookCaption,
  buildFacebookCaptionVariants,
  buildPinterestCaption,
  buildPinterestCaptionVariants,
} from "@/lib/social/core/captions";

type ContentType = "recipe" | "guide";

function trafficUrl(slug: string, type: ContentType, platform: "facebook" | "pinterest") {
  const section = type === "guide" ? "guides" : "recipes";
  return `https://www.vegan-masala.com/${section}/${slug}?utm_source=${platform}&utm_medium=organic_social&utm_campaign=evergreen_content`;
}

function ensureTrafficUrl(
  text: string,
  slug: string,
  type: ContentType,
  platform: "facebook" | "pinterest"
) {
  const section = type === "guide" ? "guides" : "recipes";
  const canonical = `https://www.vegan-masala.com/${section}/${slug}`;
  const tracked = trafficUrl(slug, type, platform);
  if (text.includes(`${canonical}?utm_source=`)) return text;
  if (text.includes(canonical)) return text.split(canonical).join(tracked);
  return `${text.trim()}\n\n${tracked}`;
}

function ensureFacebookDistribution(text: string) {
  let result = String(text || "").trim();
  if (!/\?/.test(result)) {
    result += "\n\nWhat would you serve with this: rice, roti, or something else?";
  }
  if (!/follow vegan masala/i.test(result)) {
    result += "\n\nFollow Vegan Masala for practical vegan Indian dinner ideas every week.";
  }
  return result;
}

function ensurePinterestDiscovery(text: string) {
  const result = String(text || "").trim();
  if (/save (this|it|the)/i.test(result)) return result;
  return `${result}\n\nSave this recipe or guide so it is ready when you need it.`;
}


function ensureHashtags(
  text: string,
  fallbackTags: string[]
) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return fallbackTags.join("\n");

  if (/#\w+/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}\n\n${fallbackTags.join("\n")}`;
}

function instagramFallbackTags(slug: string) {
  const slugTags = slug
    .split("-")
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => `#${part.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`)
    .filter(Boolean);

  return [
    ...slugTags,
    "#veganrecipes",
    "#veganindian",
    "#indianfood",
    "#plantbased",
    "#vegancooking",
    "#homecooking",
    "#veganuk",
    "#veganmasala",
  ].filter((tag, i, arr) => arr.indexOf(tag) === i);
}

function facebookFallbackTags() {
  return ["#veganmasala", "#plantbased", "#indianfood"];
}

function pinterestFallbackTags() {
  return [
    "#veganrecipes",
    "#veganindian",
    "#indianfood",
    "#plantbased",
    "#vegancooking",
    "#veganmasala",
  ];
}

function tiktokFallbackTags() {
  return ["#veganindian", "#veganrecipes", "#indianfood", "#veganmasala"];
}

function youtubeFallbackTags() {
  return ["#VeganIndian", "#VeganRecipes", "#VeganMasala"];
}

export async function getSocialCopyForSlug(slug: string) {
  const detected = detectContentTypeBySlug(slug);
  const type = (detected || "recipe") as ContentType;

  try {
    const ai = await generateSocialCopyForSlug(slug, type);

    if (ai) {
      return {
        type,
        instagramCaption: ensureHashtags(
          ai.instagramCaptionVariants[0] || buildInstagramCaption(slug, type),
          instagramFallbackTags(slug)
        ),
        instagramCaptionVariants:
          (ai.instagramCaptionVariants.length > 0
            ? ai.instagramCaptionVariants
            : buildInstagramCaptionVariants(slug, type)
          ).map((variant) => ensureHashtags(variant, instagramFallbackTags(slug))),

        facebookCaption: ensureTrafficUrl(ensureHashtags(ensureFacebookDistribution(
          ai.facebookCaptionVariants[0] || buildFacebookCaption(slug, type)
        ), facebookFallbackTags()), slug, type, "facebook"),
        facebookCaptionVariants:
          (ai.facebookCaptionVariants.length > 0
            ? ai.facebookCaptionVariants
            : buildFacebookCaptionVariants(slug, type)
          ).map((variant) => ensureTrafficUrl(
            ensureHashtags(ensureFacebookDistribution(variant), facebookFallbackTags()), slug, type, "facebook"
          )),

        pinterestCaption: ensureTrafficUrl(ensureHashtags(ensurePinterestDiscovery(
          ai.pinterestCaptionVariants[0] || buildPinterestCaption(slug, type)
        ), pinterestFallbackTags()), slug, type, "pinterest"),
        pinterestCaptionVariants:
          (ai.pinterestCaptionVariants.length > 0
            ? ai.pinterestCaptionVariants
            : buildPinterestCaptionVariants(slug, type)
          ).map((variant) => ensureTrafficUrl(
            ensureHashtags(ensurePinterestDiscovery(variant), pinterestFallbackTags()), slug, type, "pinterest"
          )),

        tiktokCaption: ensureHashtags(
          ai.tiktokCaptionVariants[0] || ai.instagramCaptionVariants[0] || buildInstagramCaption(slug, type),
          tiktokFallbackTags()
        ),
        tiktokCaptionVariants:
          (ai.tiktokCaptionVariants.length > 0
            ? ai.tiktokCaptionVariants
            : ai.instagramCaptionVariants.length > 0
              ? ai.instagramCaptionVariants
              : buildInstagramCaptionVariants(slug, type)
          ).slice(0, 2).map((variant) => ensureHashtags(variant, tiktokFallbackTags())),

        youtubeDescription: ensureHashtags(
          ai.youtubeDescriptionVariants[0] || ai.facebookCaptionVariants[0] || buildFacebookCaption(slug, type),
          youtubeFallbackTags()
        ),
        youtubeDescriptionVariants:
          (ai.youtubeDescriptionVariants.length > 0
            ? ai.youtubeDescriptionVariants
            : ai.facebookCaptionVariants.length > 0
              ? ai.facebookCaptionVariants
              : buildFacebookCaptionVariants(slug, type)
          ).slice(0, 2).map((variant) => ensureHashtags(variant, youtubeFallbackTags())),

        instagramImageHook: ai.instagramImageHook || "",
        instagramImageSubtitle: ai.instagramImageSubtitle || "",
        pinterestImageHook: ai.pinterestImageHook || "",
        pinterestImageSubtitle: ai.pinterestImageSubtitle || "",
        videoTitle: ai.videoTitle || "",
        videoHook: ai.videoHook || "",
        videoMainLine: ai.videoMainLine || "",
        videoOutroLine: ai.videoOutroLine || "",
      };
    }
  } catch (err) {
    console.error("AI social copy failed for slug:", slug, err);
  }

  return {
    type,
    instagramCaption: ensureHashtags(
      buildInstagramCaption(slug, type),
      instagramFallbackTags(slug)
    ),
    instagramCaptionVariants: buildInstagramCaptionVariants(slug, type).map((variant) =>
      ensureHashtags(variant, instagramFallbackTags(slug))
    ),
    facebookCaption: ensureTrafficUrl(ensureHashtags(ensureFacebookDistribution(
      buildFacebookCaption(slug, type)
    ), facebookFallbackTags()), slug, type, "facebook"),
    facebookCaptionVariants: buildFacebookCaptionVariants(slug, type).map((variant) =>
      ensureTrafficUrl(ensureHashtags(ensureFacebookDistribution(variant), facebookFallbackTags()), slug, type, "facebook")
    ),
    pinterestCaption: ensureTrafficUrl(ensureHashtags(ensurePinterestDiscovery(
      buildPinterestCaption(slug, type)
    ), pinterestFallbackTags()), slug, type, "pinterest"),
    pinterestCaptionVariants: buildPinterestCaptionVariants(slug, type).map((variant) =>
      ensureTrafficUrl(ensureHashtags(ensurePinterestDiscovery(variant), pinterestFallbackTags()), slug, type, "pinterest")
    ),
    tiktokCaption: ensureHashtags(
      buildInstagramCaption(slug, type),
      tiktokFallbackTags()
    ),
    tiktokCaptionVariants: buildInstagramCaptionVariants(slug, type)
      .slice(0, 2)
      .map((variant) => ensureHashtags(variant, tiktokFallbackTags())),
    youtubeDescription: ensureHashtags(
      buildFacebookCaption(slug, type),
      youtubeFallbackTags()
    ),
    youtubeDescriptionVariants: buildFacebookCaptionVariants(slug, type)
      .slice(0, 2)
      .map((variant) => ensureHashtags(variant, youtubeFallbackTags())),

    instagramImageHook: "",
    instagramImageSubtitle: "",
    pinterestImageHook: "",
    pinterestImageSubtitle: "",
    videoTitle: "",
    videoHook: "",
    videoMainLine: "",
    videoOutroLine: "",
  };
}
