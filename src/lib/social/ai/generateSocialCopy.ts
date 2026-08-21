import OpenAI from "openai";
import { getRecipeBySlug } from "@/lib/recipes";
import { getGuideBySlug } from "@/lib/guides";

type ContentType = "recipe" | "guide";

type SocialCopyResult = {
  instagramCaptionVariants: string[];
  facebookCaptionVariants: string[];
  pinterestCaptionVariants: string[];
  instagramImageHook: string;
  instagramImageSubtitle: string;
  pinterestImageHook: string;
  pinterestImageSubtitle: string;
  videoHook: string;
  videoMainLine: string;
  videoOutroLine: string;
};

const BANNED_GENERIC_PHRASES = [
  "packed with flavour",
  "flavour-packed",
  "perfect weeknight meal",
  "restaurant-quality",
  "comes together beautifully",
  "delicious and comforting",
];

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v || "").trim()).filter(Boolean);
}

function safeString(value: unknown): string {
  return String(value || "").trim();
}

function hashtagCount(text: string) {
  return text.match(/#[\p{L}\p{N}_]+/gu)?.length || 0;
}

function normalizedWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/#[\p{L}\p{N}_]+/gu, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
  );
}

function similarity(a: string, b: string) {
  const left = normalizedWords(a);
  const right = normalizedWords(b);
  if (!left.size || !right.size) return 0;
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared / new Set([...left, ...right]).size;
}

function validateVariants(
  label: string,
  variants: string[],
  expected: number,
  maxLength: number,
  hashtagRange: [number, number]
) {
  if (variants.length !== expected) {
    throw new Error(`${label} must contain exactly ${expected} variants`);
  }

  variants.forEach((variant, index) => {
    if (variant.length > maxLength) {
      throw new Error(`${label} variant ${index + 1} exceeds ${maxLength} characters`);
    }
    const tags = hashtagCount(variant);
    if (tags < hashtagRange[0] || tags > hashtagRange[1]) {
      throw new Error(`${label} variant ${index + 1} has ${tags} hashtags`);
    }
    const lower = variant.toLowerCase();
    if (BANNED_GENERIC_PHRASES.some((phrase) => lower.includes(phrase))) {
      throw new Error(`${label} variant ${index + 1} contains generic copy`);
    }
  });

  for (let i = 0; i < variants.length; i += 1) {
    for (let j = i + 1; j < variants.length; j += 1) {
      if (similarity(variants[i], variants[j]) > 0.72) {
        throw new Error(`${label} variants ${i + 1} and ${j + 1} are too similar`);
      }
    }
  }
}

function validateShortLine(label: string, value: string, maxLength: number) {
  if (!value || value.length > maxLength) {
    throw new Error(`${label} must be 1–${maxLength} characters`);
  }
}

function parseAndValidate(parsed: Record<string, unknown>): SocialCopyResult {
  const result = {
    instagramCaptionVariants: cleanArray(parsed.instagramCaptionVariants).slice(0, 3),
    facebookCaptionVariants: cleanArray(parsed.facebookCaptionVariants).slice(0, 2),
    pinterestCaptionVariants: cleanArray(parsed.pinterestCaptionVariants).slice(0, 2),
    instagramImageHook: safeString(parsed.instagramImageHook),
    instagramImageSubtitle: safeString(parsed.instagramImageSubtitle),
    pinterestImageHook: safeString(parsed.pinterestImageHook),
    pinterestImageSubtitle: safeString(parsed.pinterestImageSubtitle),
    videoHook: safeString(parsed.videoHook),
    videoMainLine: safeString(parsed.videoMainLine),
    videoOutroLine: safeString(parsed.videoOutroLine),
  };

  validateVariants("Instagram", result.instagramCaptionVariants, 3, 1800, [8, 12]);
  validateVariants("Facebook", result.facebookCaptionVariants, 2, 1200, [3, 5]);
  validateVariants("Pinterest", result.pinterestCaptionVariants, 2, 500, [5, 8]);
  validateShortLine("Instagram image hook", result.instagramImageHook, 80);
  validateShortLine("Instagram image subtitle", result.instagramImageSubtitle, 72);
  validateShortLine("Pinterest image hook", result.pinterestImageHook, 100);
  validateShortLine("Pinterest image subtitle", result.pinterestImageSubtitle, 90);
  validateShortLine("Video hook", result.videoHook, 80);
  validateShortLine("Video main line", result.videoMainLine, 72);
  validateShortLine("Video outro line", result.videoOutroLine, 48);

  return result;
}

export async function generateSocialCopyForSlug(
  slug: string,
  type: ContentType
): Promise<SocialCopyResult | null> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const source =
    type === "recipe" ? getRecipeBySlug(slug) : getGuideBySlug(slug);

  if (!source) {
    return null;
  }

  const payload =
    type === "recipe"
      ? {
          type,
          slug,
          title: source.title,
          description: source.description || "",
          introNote: (source as any).introNote || "",
          servingSuggestion: (source as any).servingSuggestion || "",
          socialHook: (source as any).socialHook || "",
          ingredients: (source as any).ingredients || [],
          instructions: (source as any).instructions || [],
          notes: (source as any).notes || [],
          ingredientsMarkdown: (source as any).ingredientsMarkdown || "",
          methodMarkdown: (source as any).methodMarkdown || "",
          notesMarkdown: (source as any).notesMarkdown || "",
          tags: (source as any).tags || [],
        }
      : {
          type,
          slug,
          title: source.title,
          description: source.description || "",
        };

  const response = await client.responses.create({
    model: "gpt-5.4",
    store: false,
    input: [
      {
        role: "system",
        content: `
You are a professional Indian chef and food writer creating social media copy for a premium vegan Indian cooking brand.

Write copy that is:
- specific to the exact dish
- grounded in ingredients, method, texture, and serving style
- natural and confident
- never generic or repetitive
- never full of empty adjectives
- never obviously AI-written

Use the recipe data heavily.
If the dish uses aubergine, potato, lentils, chickpeas, pastry, rice, tofu, or tempering, reflect that directly.
If the dish is baked, roasted, simmered, fried, or finished with a tadka, reflect that directly.

Rules:
- Instagram variants: Warm, Practical, Punchy
- Facebook variants: Warm, Practical
- Pinterest variants: Search-friendly, Inviting
- Every Instagram caption variant must end with 8 to 12 relevant hashtags, each on its own line
- Every Facebook caption variant must end with 3 to 5 relevant hashtags
- Every Pinterest caption variant must end with 5 to 8 relevant hashtags
- Always include brand-safe core tags where relevant, such as #veganrecipes #veganindian #indianfood #plantbased #veganmasala
- Add dish-specific hashtags when relevant, such as ingredient, dish name, or style of cooking
- instagramImageHook: 1 sentence, premium, elegant, concise
- instagramImageSubtitle: 1 sentence, service/texture/cooking payoff
- pinterestImageHook: 1 sentence, more descriptive, more ingredient-led, more explicit
- pinterestImageSubtitle: 1 sentence, mention serving style, texture, or what the dish contains
- videoHook: 1 short striking reel opening line, fast and scroll-stopping
- videoMainLine: 1 short line describing a real transformation, technique or texture from this exact recipe
- videoOutroLine: 1 short, varied CTA suited to this dish; avoid defaulting to "Full recipe on Vegan Masala"
- Keep image and video text readable on the graphic
- For video text, prefer shorter, punchier lines than for static posts
- Do not repeat the opening sentence or core phrasing across variants or platforms
- Do not invent ingredients, timings, techniques, cultural claims or health claims
        `.trim(),
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "vegan_masala_social_copy",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            instagramCaptionVariants: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" },
            },
            facebookCaptionVariants: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" },
            },
            pinterestCaptionVariants: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" },
            },
            instagramImageHook: { type: "string" },
            instagramImageSubtitle: { type: "string" },
            pinterestImageHook: { type: "string" },
            pinterestImageSubtitle: { type: "string" },
            videoHook: { type: "string" },
            videoMainLine: { type: "string" },
            videoOutroLine: { type: "string" },
          },
          required: [
            "instagramCaptionVariants",
            "facebookCaptionVariants",
            "pinterestCaptionVariants",
            "instagramImageHook",
            "instagramImageSubtitle",
            "pinterestImageHook",
            "pinterestImageSubtitle",
            "videoHook",
            "videoMainLine",
            "videoOutroLine",
          ],
        },
      },
    },
  });

  if (!response.output_text) throw new Error("AI returned no social copy");
  return parseAndValidate(JSON.parse(response.output_text));
}
