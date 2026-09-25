import { NextResponse } from "next/server";

import { getRecipeBySlug } from "@/lib/recipes";

const PREPARATION_ACTIONS: Array<{ pattern: RegExp; instruction: (ingredient: string) => string }> = [
  { pattern: /,\s*finely chopped\b/i, instruction: (ingredient) => `Finely chop ${ingredient}.` },
  { pattern: /,\s*roughly chopped\b/i, instruction: (ingredient) => `Roughly chop ${ingredient}.` },
  { pattern: /,\s*chopped\b/i, instruction: (ingredient) => `Chop ${ingredient}.` },
  { pattern: /,\s*minced\b/i, instruction: (ingredient) => `Mince ${ingredient}.` },
  { pattern: /,\s*finely grated\b/i, instruction: (ingredient) => `Finely grate ${ingredient}.` },
  { pattern: /,\s*grated\b/i, instruction: (ingredient) => `Grate ${ingredient}.` },
  { pattern: /,\s*cubed\b/i, instruction: (ingredient) => `Cut ${ingredient} into even cubes.` },
  { pattern: /,\s*diced\b/i, instruction: (ingredient) => `Dice ${ingredient} evenly.` },
  { pattern: /,\s*thinly sliced\b/i, instruction: (ingredient) => `Thinly slice ${ingredient}.` },
  { pattern: /,\s*sliced lengthwise\b/i, instruction: (ingredient) => `Slice ${ingredient} lengthwise.` },
  { pattern: /,\s*sliced\b/i, instruction: (ingredient) => `Slice ${ingredient}.` },
  { pattern: /,\s*crushed\b/i, instruction: (ingredient) => `Crush ${ingredient}.` },
  { pattern: /,\s*peeled\b/i, instruction: (ingredient) => `Peel ${ingredient}.` },
  { pattern: /,\s*rinsed\b/i, instruction: (ingredient) => `Rinse ${ingredient}.` },
  { pattern: /,\s*drained\b/i, instruction: (ingredient) => `Drain ${ingredient}.` },
];

function preparationInstruction(ingredient: string) {
  for (const action of PREPARATION_ACTIONS) {
    if (!action.pattern.test(ingredient)) continue;
    const subject = ingredient.replace(action.pattern, "").trim();
    return action.instruction(subject);
  }
  return null;
}

function conciseMethodCaption(instruction: string) {
  return instruction
    .replace(/\s+/g, " ")
    .replace(/\bjust until\b/gi, "until")
    .replace(/\bso that\b/gi, "so")
    .replace(/\ba little more\b/gi, "more")
    .trim();
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return NextResponse.json({ ok: false, error: "Recipe not found." }, { status: 404 });

  const preparation = (recipe.ingredients || [])
    .map((ingredient, index) => ({ ingredient, originalIndex: index }))
    .map(({ ingredient, originalIndex }) => ({ ingredient, originalIndex, caption: preparationInstruction(ingredient) }))
    .filter((item): item is { ingredient: string; originalIndex: number; caption: string } => Boolean(item.caption))
    .map((item, index) => ({
      id: `prep-${index + 1}`,
      number: index + 1,
      phase: "prep" as const,
      ingredient: item.ingredient,
      instruction: item.caption,
      caption: item.caption,
      sourceNumber: item.originalIndex + 1,
    }));

  const method = (recipe.instructions || []).map((instruction, index) => ({
    id: `step-${index + 1}`,
    number: index + 1,
    phase: "method" as const,
    instruction,
    caption: conciseMethodCaption(instruction),
    sourceNumber: index + 1,
  }));

  return NextResponse.json({
    ok: true,
    recipe: {
      slug: recipe.slug,
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      preparation,
      method,
      steps: [...preparation, ...method],
    },
  });
}
