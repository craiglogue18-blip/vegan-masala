import OpenAI from "openai";

import { getGuideBySlug } from "@/lib/guides";
import { getRecipeBySlug } from "@/lib/recipes";
import type { CampaignKind } from "@/lib/social/campaigns/catalog";

export type CampaignCopy = {
  eyebrow: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  caption: string;
  captionVariants: string[];
  destinationUrl: string;
  imagePath: string;
  partnerLogoPath?: string;
  disclosure?: string;
};

const SPICES: Array<{ match: RegExp; name: string; image: string; fact: string }> = [
  { match: /cumin/i, name: "Cumin", image: "/images/spices/cumin_seeds.jpg", fact: "Toast cumin briefly to deepen its earthy aroma before the rest of the masala goes in." },
  { match: /mustard seed/i, name: "Mustard seeds", image: "/images/spices/mustard_seed.jpg", fact: "Mustard seeds are ready for the next ingredient once they begin to pop in the hot oil." },
  { match: /turmeric/i, name: "Turmeric", image: "/images/spices/turmeric.jpg", fact: "Turmeric brings earthy warmth and colour; a little goes a long way in a balanced masala." },
  { match: /garam masala/i, name: "Garam masala", image: "/images/spices/garam_masala.jpg", fact: "Adding garam masala near the end keeps its aromatic spices clear and fragrant." },
  { match: /fenugreek|methi/i, name: "Fenugreek", image: "/images/spices/fenugreek.jpg", fact: "Fenugreek adds a savoury, gently bitter edge that balances rich tomato and potato dishes." },
  { match: /cardamom/i, name: "Cardamom", image: "/images/spices/green_cardamom.jpg", fact: "Crush cardamom pods lightly so their floral aroma can move through the cooking oil." },
  { match: /coriander/i, name: "Coriander", image: "/images/spices/coriander_seed.jpg", fact: "Coriander brings a citrusy warmth that rounds out chilli and cumin." },
  { match: /pepper/i, name: "Black pepper", image: "/images/spices/peppercorns.jpg", fact: "Freshly cracked black pepper gives a brighter, more immediate heat than pre-ground pepper." },
  { match: /fennel/i, name: "Fennel", image: "/images/spices/fennel_seed.jpg", fact: "Fennel gives a sweet anise note that softens sharper chilli and pepper." },
  { match: /curry leaves/i, name: "Curry leaves", image: "/images/spices/curry_leaves.jpg", fact: "Fry curry leaves briefly in oil to release their citrusy, savoury aroma." },
];

function clean(value: unknown, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function firstSentence(value: string, max = 150) {
  const text = clean(value).replace(/^[-*]\s*/, "");
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0] || text;
  if (sentence.length <= max) return sentence;
  const clipped = sentence.slice(0, max + 1).replace(/\s+\S*$/, "").replace(/[,:;\-–—]+$/, "");
  return `${clipped}.`;
}

function fitCompleteText(value: unknown, fallbackValue: string, max: number) {
  const candidate = clean(value, fallbackValue);
  if (candidate.length <= max) return candidate;
  const complete = candidate.slice(0, max + 1).match(/^.*[.!?](?=\s|$)/)?.[0]?.trim();
  if (complete && complete.length >= Math.min(45, max / 2)) return complete;
  const fallback = clean(fallbackValue);
  if (fallback && fallback !== candidate) return fitCompleteText(fallback, "", max);
  const clipped = candidate.slice(0, max + 1).replace(/\s+\S*$/, "").replace(/[,:;\-–—.!?]+$/, "").trim();
  return clipped ? `${clipped}.` : "";
}

function tracked(path: string, campaign: CampaignKind) {
  const url = new URL(path, "https://www.vegan-masala.com");
  url.searchParams.set("utm_source", "social");
  url.searchParams.set("utm_medium", "organic_campaign");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

function recipePayload(slug: string) {
  const recipe = getRecipeBySlug(slug);
  if (!recipe) throw new Error("Select a valid recipe for this campaign");
  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];
  return { recipe, ingredients, instructions };
}

function guidePayload(slug: string) {
  const guide = getGuideBySlug(slug);
  if (!guide) return null;
  return guide;
}

function fallback(kind: CampaignKind, slug?: string): CampaignCopy {
  if (kind === "affiliate") {
    const destinationUrl = tracked("/guides/spices", kind);
    return {
      eyebrow: "AFFILIATE PARTNER",
      title: "Build a better spice shelf",
      hook: "Nine foundational spices, one beautifully made tin.",
      body: "Spice Kitchen’s Indian Spice Tin includes nine spices and blends, a spice spoon and a mini recipe book. UK delivery is free on orders over £25.",
      cta: "Explore via Vegan Masala",
      caption: `A useful spice collection should make everyday cooking easier—not just look good on a shelf. Spice Kitchen’s Indian Spice Tin brings nine foundational spices and blends together with a spice spoon and mini recipe book. Explore it through our spice guide: ${destinationUrl}\n\nPaid affiliate link · no extra cost to you\n\n#Ad #VeganIndianFood #IndianSpices #VeganMasala #SpiceKitchen`,
      captionVariants: [],
      destinationUrl,
      imagePath: "/images/affiliates/spice-kitchen-indian-spice-tin.png",
      partnerLogoPath: "/images/affiliates/spice-kitchen-logo.png",
      disclosure: "Paid affiliate partnership · no extra cost to you",
    };
  }

  if (kind === "meal-planner") {
    const destinationUrl = tracked("/meal-planner", kind);
    return {
      eyebrow: "VEGAN MASALA TOOL",
      title: "What’s for dinner this week?",
      hook: "Turn recipe indecision into a practical plan.",
      body: "Build a vegan Indian meal plan, organise the week and make shopping easier from one place.",
      cta: "Try the meal planner",
      caption: `Too many saved recipes and still no idea what to cook? Use the Vegan Masala meal planner to turn inspiration into a practical week: ${destinationUrl}\n\n#VeganMealPlan #VeganIndianFood #MealPlanning #WeeknightDinner #VeganMasala`,
      captionVariants: [], destinationUrl,
      imagePath: "/images/home/collections/quick-meals.webp",
    };
  }

  if (kind === "dinner-plan") {
    const destinationUrl = tracked("/dinner-plan", kind);
    return {
      eyebrow: "FREE 7-DAY PLAN",
      title: "Seven vegan Indian dinners, planned",
      hook: "A full week of dinner inspiration without the daily decision.",
      body: "Get the free Vegan Masala dinner plan and make next week’s cooking feel simpler.",
      cta: "Get the free plan",
      caption: `Your next seven dinners are already planned. Get the free Vegan Masala dinner plan here: ${destinationUrl}\n\n#VeganDinner #VeganMealPlan #IndianFood #PlantBasedCooking #VeganMasala`,
      captionVariants: [], destinationUrl,
      imagePath: "/images/social/newsletter/free-dinner-plan-feed-2026-09-background.png",
    };
  }

  const guide = slug ? guidePayload(slug) : null;
  if (guide) {
    const destinationUrl = tracked(`/guides/${guide.slug}`, kind);
    const label = kind === "mistake" ? "DON’T RUSH THIS" : "COOKING KNOW-HOW";
    return {
      eyebrow: label,
      title: kind === "mistake" ? "The shortcut that costs flavour" : guide.title,
      hook: firstSentence(guide.description || guide.content, 90),
      body: firstSentence(guide.content, 150),
      cta: "Read the full guide",
      caption: `${firstSentence(guide.description || guide.content, 220)} Read the complete Vegan Masala guide: ${destinationUrl}\n\n#IndianCooking #CookingTips #VeganCooking #LearnToCook #VeganMasala`,
      captionVariants: [], destinationUrl,
      imagePath: guide.image || "/images/guides/indian-spices-guide.png",
    };
  }

  const { recipe, ingredients, instructions } = recipePayload(slug || "");
  const destinationUrl = tracked(`/recipes/${recipe.slug}`, kind);
  const imagePath = recipe.image || `/images/recipes/${recipe.slug}.png`;
  const sourceText = [...ingredients, ...instructions].join(" ");
  const spice = SPICES.find((item) => item.match.test(sourceText)) || SPICES[0];
  const step = firstSentence(instructions[0] || recipe.description || "Cook the masala until it is fragrant.", 145);

  if (kind === "ingredient") {
    return {
      eyebrow: "INGREDIENT SPOTLIGHT",
      title: `Why ${spice.name.toLowerCase()} matters`,
      hook: spice.fact,
      body: `${spice.name} is part of the flavour story in ${recipe.title}.`,
      cta: "See it in the recipe",
      caption: `${spice.fact} See how it is used in ${recipe.title}: ${destinationUrl}\n\n#IndianSpices #CookingTips #VeganIndianFood #LearnToCook #VeganMasala`,
      captionVariants: [], destinationUrl, imagePath: spice.image,
    };
  }

  if (kind === "mistake") {
    return {
      eyebrow: "COMMON COOKING MISTAKE",
      title: "Don’t rush the flavour base",
      hook: step,
      body: `${recipe.title} rewards attention to the order and texture of each step—not just the ingredient list.`,
      cta: "Follow the full method",
      caption: `The ingredient list is only half the recipe. In ${recipe.title}, the order and texture of each step build the final flavour. Start here: ${destinationUrl}\n\n#CookingMistakes #IndianCooking #CookingTips #VeganRecipes #VeganMasala`,
      captionVariants: [], destinationUrl, imagePath,
    };
  }

  if (kind === "behind-the-recipe") {
    return {
      eyebrow: "BEHIND THE RECIPE",
      title: recipe.title,
      hook: clean(recipe.socialHook || recipe.introNote || recipe.description, "The finished plate starts with the details you do not see."),
      body: step,
      cta: "Cook the full recipe",
      caption: `Behind the finished plate: ${step} Explore the complete ${recipe.title} recipe: ${destinationUrl}\n\n#BehindTheRecipe #FoodProcess #VeganIndianFood #HomeCooking #VeganMasala`,
      captionVariants: [], destinationUrl, imagePath,
    };
  }

  return {
    eyebrow: "SAVE THIS TECHNIQUE",
    title: `One useful step from ${recipe.title}`,
    hook: step,
    body: firstSentence(recipe.description || recipe.introNote || `Use this step when you cook ${recipe.title}.`, 145),
    cta: "Get the complete method",
    caption: `${step} It is one of the details that makes ${recipe.title} work. Get the complete method: ${destinationUrl}\n\n#CookingTechnique #IndianCooking #VeganRecipes #CookingTips #VeganMasala`,
    captionVariants: [], destinationUrl, imagePath,
  };
}

function parseAi(text: string, base: CampaignCopy): CampaignCopy | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const data = JSON.parse(text.slice(start, end + 1));
    const captions = Array.isArray(data.captionVariants)
      ? data.captionVariants.map((item: unknown) => clean(item)).filter(Boolean).slice(0, 3)
      : [];
    return {
      ...base,
      title: fitCompleteText(data.title, base.title, 78).replace(/[.!?]$/, ""),
      hook: fitCompleteText(data.hook, base.hook, 125),
      body: fitCompleteText(data.body, base.body, 210),
      cta: fitCompleteText(data.cta, base.cta, 38).replace(/[.!?]$/, ""),
      caption: captions[0] || base.caption,
      captionVariants: captions.length ? captions : [base.caption],
    };
  } catch {
    return null;
  }
}

export async function buildCampaignCopy(kind: CampaignKind, slug?: string) {
  const base = fallback(kind, slug);
  if (!process.env.OPENAI_API_KEY?.trim()) return { ...base, captionVariants: [base.caption] };

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await client.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "system",
          content: `You create premium social campaigns for Vegan Masala, a UK vegan Indian cooking website. Rewrite only from the supplied verified material. Lead with a useful, curiosity-building hook in the first line. Sound like a knowledgeable human cook, not an advert or AI. Use a specific technique, sensory detail, honest problem, question or behind-the-scenes moment. Never invent an ingredient, claim, price, discount or result. No clickbait, ellipses, unfinished sentences, generic hype or #fyp. Keep on-art text concise. Preserve affiliate disclosure and the exact destination URL in every affiliate caption. For affiliate content, recommend contextually and never imply personal use unless supplied. Return strict JSON: {"title":"","hook":"","body":"","cta":"","captionVariants":["","",""]}. Each caption should give value before its CTA, include the exact destination URL, and end with 4-7 focused hashtags.`,
        },
        { role: "user", content: JSON.stringify({ kind, slug, verifiedMaterial: base, currentDate: new Date().toISOString().slice(0, 10), audience: "UK home cooks seeking practical vegan Indian food", objective: "earn an intentional website visit or save" }) },
      ],
    });
    return parseAi(response.output_text || "", base) || { ...base, captionVariants: [base.caption] };
  } catch {
    return { ...base, captionVariants: [base.caption] };
  }
}
