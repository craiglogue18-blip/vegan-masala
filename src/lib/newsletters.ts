import OpenAI from "openai";

import {
  AMAZON_PRODUCTS,
  amazonUkProductUrl,
  SPICE_KITCHEN_INDIAN_TIN_URL,
  spiceKitchenAffiliateUrl,
} from "@/lib/affiliate";
import { getAllGuides, getGuideBySlug, type Guide } from "@/lib/guides";
import { getPublicRecipes, getRecipeBySlug, type Recipe } from "@/lib/recipes";

export type NewsletterRecipeSection = {
  slug: string;
  heading: string;
  description: string;
  cta: string;
};

export type NewsletterDraft = {
  subject: string;
  previewText: string;
  introduction: string;
  recipes: NewsletterRecipeSection[];
  guide: { slug: string; heading: string; description: string; cta: string };
  affiliate: { key: string; title: string; description: string; cta: string } | null;
  tipTitle: string;
  tipBody: string;
  closing: string;
  postscript: string;
};

type GeneratedCopy = Omit<NewsletterDraft, "recipes" | "guide" | "affiliate"> & {
  recipes: Array<Omit<NewsletterRecipeSection, "slug"> & { slug?: string }>;
  guide?: { heading?: string; description?: string; cta?: string };
};

const SITE_URL = "https://www.vegan-masala.com";
const EMAIL_FONT = "'Trebuchet MS', 'Arial Rounded MT Bold', Arial, sans-serif";
const EMAIL_GOLD = "#e9bd55";
const EMAIL_GOLD_BRIGHT = "#f4cf70";

function cleanText(value: unknown, limit = 800) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function cleanMultiline(value: unknown, limit = 800) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function campaignName(subject: string) {
  return cleanText(subject, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 55) || "vegan_masala_newsletter";
}

function trackedUrl(path: string, campaign: string) {
  const url = new URL(path, SITE_URL);
  url.searchParams.set("utm_source", "kit");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

function imageUrl(recipe: Recipe) {
  const image = cleanText(recipe.image, 400);
  if (!image) return `${SITE_URL}/images/recipes/${encodeURIComponent(recipe.slug)}.png`;
  return new URL(image, SITE_URL).toString();
}

function guideImageUrl(guide: Guide) {
  const image = cleanText(guide.image, 400) || "/images/guides/spices.jpg";
  return new URL(image, SITE_URL).toString();
}

const AFFILIATE_RECOMMENDATIONS = {
  "spice-kitchen-tin": {
    title: "Spice Kitchen Indian Spice Tin",
    description: "Nine foundational spices and blends in one reusable tin, with a spice spoon and mini recipe book.",
    cta: "Explore the Indian Spice Tin",
    url: (campaign: string) => spiceKitchenAffiliateUrl(`newsletter-${campaign}-spice-tin`, SPICE_KITCHEN_INDIAN_TIN_URL),
  },
  "spice-grinder": {
    title: AMAZON_PRODUCTS.spiceGrinder.name,
    description: "A compact grinder for preparing small, aromatic batches of whole spices when you need them.",
    cta: "View the spice grinder",
    url: () => amazonUkProductUrl(AMAZON_PRODUCTS.spiceGrinder.asin),
  },
  "pressure-cooker": {
    title: AMAZON_PRODUCTS.pressureCooker.name,
    description: "A practical option for reducing hands-on cooking time when preparing lentils, chickpeas and beans from dry.",
    cta: "View the pressure cooker",
    url: () => amazonUkProductUrl(AMAZON_PRODUCTS.pressureCooker.asin),
  },
  "heavy-pot": {
    title: AMAZON_PRODUCTS.heavyPot.name,
    description: "Steady, even heat helps onion, tomato and spice bases cook down with less risk of catching.",
    cta: "View the casserole dish",
    url: () => amazonUkProductUrl(AMAZON_PRODUCTS.heavyPot.asin),
  },
  "fine-sieve": {
    title: AMAZON_PRODUCTS.sieve.name,
    description: "A fine mesh makes it easier to rinse basmati and lentils thoroughly without losing grains.",
    cta: "View the fine-mesh sieve",
    url: () => amazonUkProductUrl(AMAZON_PRODUCTS.sieve.asin),
  },
} as const;

type AffiliateKey = keyof typeof AFFILIATE_RECOMMENDATIONS;

function guideForRecipes(recipes: Recipe[], requestedSlug?: string) {
  if (requestedSlug) {
    const requested = getGuideBySlug(requestedSlug);
    if (requested) return requested;
  }
  const source = recipes.map((recipe) => `${recipe.title} ${recipe.description || ""} ${(recipe.ingredients || []).join(" ")}`).join(" ").toLowerCase();
  const slug = /rice|biryani|pulao/.test(source) ? "how-to-cook-basmati-rice"
    : /dal|lentil|chickpea|bean|rajma|chana/.test(source) ? "lentils-and-dal"
    : /spice|masala|tadka|temper/.test(source) ? "how-to-temper-spices"
    : "how-to-build-a-curry-base";
  return getGuideBySlug(slug) || getAllGuides()[0];
}

function affiliateForGuide(guide: Guide, requestedKey?: string) {
  const preferred: AffiliateKey = requestedKey && requestedKey in AFFILIATE_RECOMMENDATIONS
    ? requestedKey as AffiliateKey
    : guide.slug === "how-to-cook-basmati-rice" ? "fine-sieve"
    : guide.slug === "lentils-and-dal" ? "pressure-cooker"
    : ["spices", "indian-spices-explained-for-beginners"].includes(guide.slug) ? "spice-kitchen-tin"
    : guide.slug === "how-to-temper-spices" ? "spice-grinder"
    : "heavy-pot";
  return { key: preferred, ...AFFILIATE_RECOMMENDATIONS[preferred] };
}

function fallbackDraft(recipes: Recipe[], theme: string, guide: Guide, includeAffiliate: boolean, affiliateKey?: string, editorialAngle?: string): NewsletterDraft {
  const recipeNames = recipes.map((recipe) => recipe.title);
  const firstInstruction = recipes
    .flatMap((recipe) => recipe.instructions || [])
    .map((instruction) => cleanText(instruction, 240))
    .find(Boolean);

  return {
    subject: theme ? `${theme} · ${recipeNames[0]}`.slice(0, 100) : `${recipeNames.length} vegan Indian dinners for the week ahead 🌿`,
    previewText: `${recipeNames.join(", ")} and one practical cooking tip from Vegan Masala.`,
    introduction: editorialAngle
      ? `${cleanText(editorialAngle, 180)}. This week's recipes and guide put that idea into practice with details you can use in your own kitchen.`
      : "Here are a few flavour-packed vegan Indian recipes for the week ahead, chosen to give you useful variety without making dinner complicated.",
    recipes: recipes.map((recipe) => ({
      slug: recipe.slug,
      heading: recipe.title,
      description: cleanText(recipe.description || recipe.introNote || `A practical Vegan Masala recipe for everyday home cooking.`, 360),
      cta: `View the ${recipe.title} recipe`,
    })),
    guide: {
      slug: guide.slug,
      heading: guide.title,
      description: cleanText(guide.description, 400),
      cta: `Read ${guide.title}`,
    },
    affiliate: includeAffiliate ? affiliateForGuide(guide, affiliateKey) : null,
    tipTitle: "A small cooking tip",
    tipBody: firstInstruction || "Give onions enough time to soften and colour before adding wet ingredients. That patient first step builds sweetness and a deeper, rounder flavour.",
    closing: "I hope one of these makes dinner easier this week.\n\nHappy cooking,\nCraig\nVegan Masala",
    postscript: "If you know someone who would enjoy more vegan Indian cooking, please forward this email to them. They can join Vegan Masala and receive the free seven-day dinner plan.",
  };
}

function parseGeneratedCopy(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Newsletter generation returned no JSON");
  return JSON.parse(text.slice(start, end + 1)) as GeneratedCopy;
}

function normaliseDraft(value: GeneratedCopy, recipes: Recipe[], guide: Guide, fallback: NewsletterDraft): NewsletterDraft {
  return {
    subject: cleanText(value.subject, 100) || fallback.subject,
    previewText: cleanText(value.previewText, 150) || fallback.previewText,
    introduction: cleanText(value.introduction, 700) || fallback.introduction,
    recipes: recipes.map((recipe, index) => {
      const generated = value.recipes?.find((item) => item.slug === recipe.slug) || value.recipes?.[index];
      return {
        slug: recipe.slug,
        heading: cleanText(generated?.heading, 120) || recipe.title,
        description: cleanText(generated?.description, 520) || fallback.recipes[index].description,
        cta: cleanText(generated?.cta, 120) || `View the ${recipe.title} recipe`,
      };
    }),
    guide: {
      slug: guide.slug,
      heading: cleanText(value.guide?.heading, 120) || fallback.guide.heading,
      description: cleanText(value.guide?.description, 520) || fallback.guide.description,
      cta: cleanText(value.guide?.cta, 120) || fallback.guide.cta,
    },
    affiliate: fallback.affiliate,
    tipTitle: cleanText(value.tipTitle, 100) || fallback.tipTitle,
    tipBody: cleanText(value.tipBody, 500) || fallback.tipBody,
    closing: cleanMultiline(value.closing, 500) || fallback.closing,
    postscript: cleanText(value.postscript, 500) || fallback.postscript,
  };
}

export async function generateNewsletterDraft(
  slugs: string[],
  theme: string,
  options: { guideSlug?: string; includeAffiliate?: boolean; affiliateKey?: string; editorialAngle?: string } = {},
) {
  const recipes = slugs.map((slug) => getRecipeBySlug(slug)).filter(Boolean) as Recipe[];
  if (recipes.length !== slugs.length) throw new Error("One or more selected recipes could not be found");

  const guide = guideForRecipes(recipes, options.guideSlug);
  if (!guide) throw new Error("No published guide could be selected");
  const fallback = fallbackDraft(recipes, cleanText(theme, 120), guide, options.includeAffiliate !== false, options.affiliateKey, options.editorialAngle);
  if (!process.env.OPENAI_API_KEY?.trim()) return fallback;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "system",
          content: `You write Vegan Masala's subscriber newsletter in warm, confident British English. The reader already subscribes, so give useful cooking value rather than asking them to sign up. Make this edition clearly distinct through its supplied editorial angle, specific recipe selection and guide. Be specific and use only facts in the supplied source data. Avoid empty adjectives, clickbait, invented timings, health claims and generic AI phrasing. The email should feel written by a knowledgeable home cook. Return strict JSON only with: subject, previewText, introduction, recipes (array of slug, heading, description, cta), guide (heading, description, cta), tipTitle, tipBody, closing, postscript. Subject max 75 characters. Preview text max 140 characters. Each recipe description 1-2 concise sentences. The guide description should explain one concrete thing the reader will learn. The tip must be a concrete technique supported by the recipe data. Closing must be signed Craig, Vegan Masala. The postscript should naturally invite forwarding and mention the free seven-day dinner plan. Do not write affiliate copy; that is supplied separately from verified data.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            theme: cleanText(theme, 120),
            editorialAngle: cleanText(options.editorialAngle, 160),
            date: new Date().toISOString().slice(0, 10),
            audience: "Existing Vegan Masala newsletter subscribers in the UK",
            recipes: recipes.map((recipe) => ({
              slug: recipe.slug,
              title: recipe.title,
              description: recipe.description || "",
              introNote: recipe.introNote || "",
              servingSuggestion: recipe.servingSuggestion || "",
              ingredients: (recipe.ingredients || []).slice(0, 18),
              instructions: (recipe.instructions || []).slice(0, 10),
              notes: (recipe.notes || []).slice(0, 6),
            })),
            guide: {
              slug: guide.slug,
              title: guide.title,
              description: guide.description || "",
              sourceExcerpt: cleanText(guide.content, 1400),
            },
          }),
        },
      ],
    });
    return normaliseDraft(parseGeneratedCopy(response.output_text || ""), recipes, guide, fallback);
  } catch {
    return fallback;
  }
}

export function validateNewsletterDraft(value: unknown): NewsletterDraft {
  const draft = value as Partial<NewsletterDraft>;
  if (!draft || typeof draft !== "object") throw new Error("Newsletter content is missing");
  if (!Array.isArray(draft.recipes) || draft.recipes.length < 1 || draft.recipes.length > 5) {
    throw new Error("Choose between one and five recipes");
  }

  const recipes = draft.recipes.map((section) => {
    const slug = cleanText(section?.slug, 160);
    const recipe = getRecipeBySlug(slug);
    if (!recipe) throw new Error(`Recipe not found: ${slug}`);
    return {
      slug,
      heading: cleanText(section?.heading, 120) || recipe.title,
      description: cleanText(section?.description, 520),
      cta: cleanText(section?.cta, 120) || `View the ${recipe.title} recipe`,
    };
  });

  const guideSlug = cleanText(draft.guide?.slug, 160);
  const guide = getGuideBySlug(guideSlug);
  if (!guide) throw new Error(`Guide not found: ${guideSlug}`);
  const affiliateKey = cleanText(draft.affiliate?.key, 80);
  const affiliate = affiliateKey && affiliateKey in AFFILIATE_RECOMMENDATIONS
    ? { key: affiliateKey, ...AFFILIATE_RECOMMENDATIONS[affiliateKey as AffiliateKey] }
    : null;

  const result = {
    subject: cleanText(draft.subject, 100),
    previewText: cleanText(draft.previewText, 150),
    introduction: cleanText(draft.introduction, 700),
    recipes,
    guide: {
      slug: guide.slug,
      heading: cleanText(draft.guide?.heading, 120) || guide.title,
      description: cleanText(draft.guide?.description, 520) || cleanText(guide.description, 520),
      cta: cleanText(draft.guide?.cta, 120) || `Read ${guide.title}`,
    },
    affiliate,
    tipTitle: cleanText(draft.tipTitle, 100),
    tipBody: cleanText(draft.tipBody, 500),
    closing: cleanMultiline(draft.closing, 500),
    postscript: cleanText(draft.postscript, 500),
  };
  if (!result.subject || !result.previewText || !result.introduction) throw new Error("Subject, preview text and introduction are required");
  if (recipes.some((recipe) => !recipe.description)) throw new Error("Every recipe needs a description");
  return result;
}

function paragraphs(value: string) {
  return value
    .split(/\n{2,}|\n/)
    .map((line) => cleanText(line, 500))
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 16px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">${escapeHtml(line)}</p>`)
    .join("");
}

export function renderNewsletterHtml(draft: NewsletterDraft) {
  const campaign = campaignName(draft.subject);
  const recipeHtml = draft.recipes.map((section) => {
    const recipe = getRecipeBySlug(section.slug);
    if (!recipe) throw new Error(`Recipe not found: ${section.slug}`);
    const url = trackedUrl(`/recipes/${recipe.slug}`, campaign);
    return `
      <h2 style="margin:34px 0 16px;color:${EMAIL_GOLD_BRIGHT};font-family:${EMAIL_FONT};font-size:27px;line-height:1.25;letter-spacing:-0.3px">${escapeHtml(section.heading)}</h2>
      <p style="margin:0 0 20px;text-align:center"><a href="${escapeHtml(url)}" style="color:${EMAIL_GOLD_BRIGHT}"><img src="${escapeHtml(imageUrl(recipe))}" alt="${escapeHtml(recipe.title)}" style="display:block;width:100%;max-width:640px;height:auto;margin:0 auto;border:1px solid #8c6d2d;border-radius:18px"></a></p>
      <p style="margin:0 0 14px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">${escapeHtml(section.description)}</p>
      <p style="margin:0 0 22px;font-family:${EMAIL_FONT};font-size:17px;line-height:1.5"><a href="${escapeHtml(url)}" style="color:${EMAIL_GOLD_BRIGHT};font-weight:700;text-decoration:underline;text-decoration-color:#8c6d2d;text-underline-offset:4px">${escapeHtml(section.cta)}</a></p>`;
  }).join("");
  const guide = getGuideBySlug(draft.guide.slug);
  if (!guide) throw new Error(`Guide not found: ${draft.guide.slug}`);
  const guideUrl = trackedUrl(`/guides/${guide.slug}`, campaign);
  const affiliate = draft.affiliate?.key && draft.affiliate.key in AFFILIATE_RECOMMENDATIONS
    ? AFFILIATE_RECOMMENDATIONS[draft.affiliate.key as AffiliateKey]
    : null;
  const affiliateHtml = affiliate ? `
    <div style="margin:34px 0 8px;padding:24px;border:1px solid #8c6d2d;border-radius:18px;background:#151109">
      <p style="margin:0 0 8px;color:${EMAIL_GOLD_BRIGHT};font-family:${EMAIL_FONT};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Useful kitchen pick · affiliate link</p>
      <h2 style="margin:0 0 12px;color:${EMAIL_GOLD_BRIGHT};font-family:${EMAIL_FONT};font-size:24px;line-height:1.25">${escapeHtml(affiliate.title)}</h2>
      <p style="margin:0 0 14px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:16px;line-height:1.6">${escapeHtml(affiliate.description)}</p>
      <p style="margin:0 0 12px;font-family:${EMAIL_FONT};font-size:16px"><a href="${escapeHtml(affiliate.url(campaign))}" style="color:${EMAIL_GOLD_BRIGHT};font-weight:700;text-decoration:underline;text-underline-offset:4px">${escapeHtml(affiliate.cta)}</a></p>
      <p style="margin:0;color:#c9a956;font-family:${EMAIL_FONT};font-size:12px;line-height:1.5">We may earn a commission from qualifying purchases, at no extra cost to you.</p>
    </div>` : "";

  const plannerUrl = trackedUrl("/meal-planner", campaign);
  const dinnerPlanUrl = trackedUrl("/dinner-plan", campaign);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="width:100%;margin:0;background:#000000;border-collapse:collapse">
      <tr><td align="center" style="padding:0;background:#000000">
        <div style="box-sizing:border-box;width:100%;max-width:700px;margin:0 auto;padding:34px 28px 38px;background:#000000;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};border:1px solid #5f4a22;border-radius:22px">
          <p style="margin:0 0 28px;text-align:center"><img src="${SITE_URL}/brand/logo-primary.png" alt="Vegan Masala" width="220" style="display:inline-block;width:220px;max-width:55%;height:auto"></p>
          <p style="margin:0 0 18px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">Hello,</p>
          <p style="margin:0 0 22px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">${escapeHtml(draft.introduction)}</p>
          ${recipeHtml}
          <h2 style="margin:34px 0 16px;color:${EMAIL_GOLD_BRIGHT};font-family:${EMAIL_FONT};font-size:27px;line-height:1.25;letter-spacing:-0.3px">${escapeHtml(draft.guide.heading)}</h2>
          <p style="margin:0 0 18px;text-align:center"><a href="${escapeHtml(guideUrl)}"><img src="${escapeHtml(guideImageUrl(guide))}" alt="${escapeHtml(guide.title)}" style="display:block;width:100%;max-width:640px;height:auto;margin:0 auto;border:1px solid #8c6d2d;border-radius:18px"></a></p>
          <p style="margin:0 0 14px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">${escapeHtml(draft.guide.description)}</p>
          <p style="margin:0 0 22px;font-family:${EMAIL_FONT};font-size:17px"><a href="${escapeHtml(guideUrl)}" style="color:${EMAIL_GOLD_BRIGHT};font-weight:700;text-decoration:underline;text-underline-offset:4px">${escapeHtml(draft.guide.cta)}</a></p>
          <h2 style="margin:34px 0 14px;color:${EMAIL_GOLD_BRIGHT};font-family:${EMAIL_FONT};font-size:27px;line-height:1.25;letter-spacing:-0.3px">${escapeHtml(draft.tipTitle)}</h2>
          <p style="margin:0 0 18px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">${escapeHtml(draft.tipBody)}</p>
          <p style="margin:0 0 24px;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:17px;line-height:1.65">Still deciding? <a href="${escapeHtml(plannerUrl)}" style="color:${EMAIL_GOLD_BRIGHT};font-weight:700;text-decoration:underline;text-decoration-color:#8c6d2d;text-underline-offset:4px">Let the free meal planner choose a recipe and build a shopping list</a>.</p>
          ${affiliateHtml}
          <div style="height:1px;margin:30px 0;background:#5f4a22"></div>
          ${paragraphs(draft.closing)}
          <p style="margin:24px 0 0;color:${EMAIL_GOLD};font-family:${EMAIL_FONT};font-size:15px;line-height:1.65"><strong style="color:${EMAIL_GOLD_BRIGHT}">P.S.</strong> ${escapeHtml(draft.postscript)} <a href="${escapeHtml(dinnerPlanUrl)}" style="color:${EMAIL_GOLD_BRIGHT};font-weight:700;text-decoration:underline;text-decoration-color:#8c6d2d;text-underline-offset:4px">Get the free seven-day dinner plan</a>.</p>
        </div>
      </td></tr>
    </table>
  `.trim();
}

export function newsletterRecipeChoices() {
  return getPublicRecipes().map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description || "",
    image: imageUrl(recipe),
  }));
}

export function newsletterGuideChoices() {
  return getAllGuides().map((guide) => ({ slug: guide.slug, title: guide.title, description: guide.description || "" }));
}
