import { NextResponse } from "next/server";

import { getRecipeBySlug } from "@/lib/recipes";

function stripQuantities(text: string) {
  return text
    .replace(/\b\d+(?:\s*\/\s*\d+)?\s*(?:tbsp|tsp|teaspoons?|tablespoons?|cups?|g|kg|ml|litres?|cloves?|medium|large|small)\b/gi, "")
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function shortenInstruction(instruction: string) {
  const cleaned = stripQuantities(instruction.replace(/\([^)]*\)/g, "").replace(/\s+/g, " "));
  const lower = cleaned.toLowerCase();

  if (lower.includes("soak") && lower.includes("potato") && lower.includes("eggplant") && lower.includes("water")) {
    return "Keep the potatoes in water; soak the eggplant with salt to slow browning.";
  }
  if (lower.includes("cumin seeds") && lower.includes("sizzle")) {
    return "Heat the oil, then let the cumin seeds sizzle.";
  }
  if (lower.includes("onion") && lower.includes("golden")) {
    return `Cook the onions${lower.includes("chilli") ? " and chilli" : ""} until soft and lightly golden.`;
  }
  if (lower.includes("garlic") && lower.includes("fragrant")) {
    const timing = cleaned.match(/\b\d+\s*(?:to|–|-)\s*\d+\s*seconds?\b/i)?.[0];
    return `Cook the garlic${timing ? ` for ${timing}` : " briefly"} until fragrant.`;
  }
  if (lower.includes("drain") && lower.includes("potato") && lower.includes("stir-fry")) {
    const timing = cleaned.match(/\b\d+\s*minutes?\b/i)?.[0];
    return `Add the drained potatoes and stir-fry${timing ? ` for ${timing}` : " briefly"}.`;
  }
  if (lower.includes("eggplant") && lower.includes("soften")) {
    return "Cook the eggplant gently until it starts to soften.";
  }
  if ((lower.includes("turmeric") || lower.includes("garam masala")) && lower.includes("coat")) {
    return `Add the spices${lower.includes("chilli") ? " and chilli" : ""}; coat the vegetables in the masala.`;
  }
  if (lower.includes("tomato") && lower.includes("break down")) {
    return "Cook the tomatoes until they break down and lose their raw aroma.";
  }
  if (lower.includes("cover") && lower.includes("simmer") && lower.includes("tender")) {
    return "Cover and simmer until the vegetables are tender.";
  }
  if (lower.includes("uncover") && (lower.includes("thicken") || lower.includes("thickened"))) {
    return `Uncover until the sauce thickens${lower.includes("coriander") ? ", then finish with fresh coriander" : ""}.`;
  }

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  let caption = sentences[0] || cleaned;

  const until = cleaned.match(/\buntil\s+([^.!?]+)/i)?.[0];
  if (until && !caption.toLowerCase().includes("until")) caption = `${caption.replace(/[.!?]+$/, "")} ${until}`;
  caption = caption
    .replace(/\bfinely chopped\b/gi, "chopped")
    .replace(/\bsliced lengthwise\b/gi, "sliced")
    .replace(/\bthe remaining\b/gi, "the")
    .replace(/\s+/g, " ")
    .trim();

  if (caption.length > 92) {
    const shortened = caption.slice(0, 89).replace(/\s+\S*$/, "").replace(/[,:;.-]+$/, "");
    caption = `${shortened}…`;
  }
  return caption.replace(/^./, (letter) => letter.toUpperCase());
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return NextResponse.json({ ok: false, error: "Recipe not found." }, { status: 404 });

  return NextResponse.json({
    ok: true,
    recipe: {
      slug: recipe.slug,
      title: recipe.title,
      steps: (recipe.instructions || []).map((instruction, index) => ({
        id: `step-${index + 1}`,
        number: index + 1,
        instruction,
        caption: shortenInstruction(instruction),
      })),
    },
  });
}
