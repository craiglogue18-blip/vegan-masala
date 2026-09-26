import type { Recipe } from "@/lib/recipes";

export type FilmingStep = {
  id: string;
  number: number;
  phase: "prep" | "method";
  instruction: string;
  caption: string;
  ingredient?: string;
  sourceNumber: number;
};

export const PRIORITY_FILMING_RECIPES = [
  { slug: "chana-masala", reason: "Consistent recipe interest and a recognisable curry with strong search potential." },
  { slug: "chapati-recipe", reason: "Evergreen bread technique that supports the free bread guide and paid masterclass." },
  { slug: "instant-oats-idli-quick-easy-indian-breakfast-lunch-recipe", reason: "Existing visitor interest and a distinctive steaming method." },
  { slug: "aloo-tofu-recipe", reason: "A useful plant-based adaptation with accessible ingredients." },
  { slug: "vegetable-upma-indian-savory-breakfast", reason: "Broadens the video library beyond curries into practical breakfasts." },
  { slug: "vegan-cauliflower-tikka-masala", reason: "A familiar high-intent dish with visually strong roasting and sauce stages." },
  { slug: "tofu-bhurji-indian-style-tofu-scramble", reason: "Fast, approachable and well suited to short-form discovery." },
  { slug: "the-best-jackfruit-curry", reason: "Popular on-site recipe with a valuable texture-focused technique." },
  { slug: "aloo-baingan-recipe", reason: "The completed prototype recipe and the best first end-to-end system test." },
  { slug: "vegetable-balti", reason: "Shows the importance of building a curry base and cooking onions properly." },
] as const;

function preparationInstruction(ingredient: string) {
  const comma = ingredient.indexOf(",");
  const parenthetical = ingredient.match(/\(([^)]*(?:chopp|grat|minc|slic|dic|crush|peel|rins|drain|press|juice)[^)]*)\)/i);
  const subject = comma >= 0 ? ingredient.slice(0, comma).trim() : ingredient.replace(parenthetical?.[0] || "", "").trim();
  let descriptor = comma >= 0 ? ingredient.slice(comma + 1).trim() : parenthetical?.[1]?.trim() || "";
  const descriptorLower = descriptor.toLowerCase();

  if (!descriptor) return null;
  const note = descriptor.match(/\(([^)]+)\)/)?.[1];
  descriptor = descriptor.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const suffix = note ? ` (${note})` : "";

  if (/drained.*pressed.*crumbled/.test(descriptorLower)) return `Drain, press and crumble ${subject}.`;
  if (/drained.*rinsed/.test(descriptorLower)) return `Drain and rinse ${subject}.`;
  if (/peeled.*roughly chopped/.test(descriptorLower)) return `Peel and roughly chop ${subject}.`;
  if (/peeled.*chopped/.test(descriptorLower)) return `Peel and chop ${subject}.`;
  if (/peeled.*cut into (.+)/.test(descriptorLower)) {
    const size = descriptor.match(/cut into (.+)/i)?.[1];
    return `Peel ${subject}, then cut it into ${size}.`;
  }
  if (/seeds removed.*cut into (.+)/.test(descriptorLower)) {
    const size = descriptor.match(/cut into (.+)/i)?.[1];
    return `Remove the seeds from ${subject}, then cut into ${size}.`;
  }
  if (/cut into (.+)/.test(descriptorLower)) {
    const size = descriptor.match(/cut into (.+)/i)?.[1];
    return `Cut ${subject} into ${size}.`;
  }
  if (/finely grated zest.*juice/.test(descriptorLower)) return `Finely grate the zest of ${subject}, then juice it.`;
  if (/chopped.*divided/.test(descriptorLower)) return `Chop ${subject}, keeping the portions separate.`;
  if (/minced.*or grated/.test(descriptorLower)) return `Mince or grate ${subject}.`;
  if (/finely chopped/.test(descriptorLower)) return `Finely chop ${subject}${suffix}.`;
  if (/roughly chopped/.test(descriptorLower)) return `Roughly chop ${subject}${suffix}.`;
  if (/chopped/.test(descriptorLower)) return `Chop ${subject}${suffix}.`;
  if (/minced/.test(descriptorLower)) return `Mince ${subject}${suffix}.`;
  if (/finely grated/.test(descriptorLower)) return `Finely grate ${subject}${suffix}.`;
  if (/grated/.test(descriptorLower)) return `Grate ${subject}${suffix}.`;
  if (/cubed/.test(descriptorLower)) return `Cut ${subject} into even cubes${suffix}.`;
  if (/diced/.test(descriptorLower)) return `Dice ${subject} evenly${suffix}.`;
  if (/thinly sliced/.test(descriptorLower)) return `Thinly slice ${subject}${suffix}.`;
  if (/sliced lengthwise/.test(descriptorLower)) return `Slice ${subject} lengthwise${suffix}.`;
  if (/sliced/.test(descriptorLower)) return `Slice ${subject}${suffix}.`;
  if (/crushed/.test(descriptorLower)) return `Crush ${subject}${suffix}.`;
  if (/peeled/.test(descriptorLower)) return `Peel ${subject}${suffix}.`;
  if (/rinsed/.test(descriptorLower)) return `Rinse ${subject}${suffix}.`;
  if (/drained/.test(descriptorLower)) return `Drain ${subject}${suffix}.`;
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

function methodFragments(instruction: string) {
  const sentences = instruction.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.flatMap((sentence) => {
    if (sentence.length <= 260 || !sentence.includes(";")) return [sentence];
    return sentence.split(/;\s+/).filter(Boolean).map((part) => part.replace(/^./, (letter) => letter.toUpperCase()));
  });
}

export function buildRecipeFilmingSteps(recipe: Recipe) {
  const preparation: FilmingStep[] = (recipe.ingredients || [])
    .map((ingredient, index) => ({ ingredient, originalIndex: index }))
    .map(({ ingredient, originalIndex }) => ({ ingredient, originalIndex, caption: preparationInstruction(ingredient) }))
    .filter((item): item is { ingredient: string; originalIndex: number; caption: string } => Boolean(item.caption))
    .map((item, index) => ({
      id: `prep-${index + 1}`,
      number: index + 1,
      phase: "prep",
      ingredient: item.ingredient,
      instruction: item.caption,
      caption: item.caption,
      sourceNumber: item.originalIndex + 1,
    }));

  const method: FilmingStep[] = (recipe.instructions || [])
    .flatMap((instruction, sourceIndex) => methodFragments(instruction).map((fragment) => ({ fragment, sourceIndex })))
    .map(({ fragment, sourceIndex }, index) => ({
      id: `step-${index + 1}`,
      number: index + 1,
      phase: "method",
      instruction: fragment,
      caption: conciseMethodCaption(fragment),
      sourceNumber: sourceIndex + 1,
    }));

  return { preparation, method, steps: [...preparation, ...method] };
}

export function sharedShotCategory(text: string) {
  const value = text.toLowerCase();
  if (value.includes("onion") && /(chop|slice|dice)/.test(value)) return "Prepare onions";
  if (value.includes("onion") && /(golden|brown|soften|caramel)/.test(value)) return "Cook onions";
  if (value.includes("garlic") && /(mince|chop|crush|grate)/.test(value)) return "Prepare garlic";
  if (value.includes("ginger") && /(mince|chop|crush|grate)/.test(value)) return "Prepare ginger";
  if (value.includes("chilli") && /(chop|slice|dice)/.test(value)) return "Prepare chillies";
  if (value.includes("tomato") && /(chop|slice|dice)/.test(value)) return "Prepare tomatoes";
  if (value.includes("coriander") && /(chop|garnish|finish)/.test(value)) return "Coriander garnish";
  if (/(cumin|mustard seeds|whole spices)/.test(value) && /(sizzle|temper|crackle|fry)/.test(value)) return "Temper whole spices";
  if (/(turmeric|garam masala|coriander powder|ground spices)/.test(value) && /(add|sprinkle|stir|mix)/.test(value)) return "Add ground spices";
  if (/(cover|simmer)/.test(value) && /(tender|soft|cook)/.test(value)) return "Covered simmer";
  if (/(tofu|jackfruit)/.test(value) && /(press|crumble|shred|tear|drain)/.test(value)) return "Prepare the protein";
  if (/(dough|chapati|roti)/.test(value) && /(knead|roll|rest|puff)/.test(value)) return "Flatbread technique";
  if (/(idli|batter)/.test(value) && /(mix|steam|mould|mold)/.test(value)) return "Idli preparation";
  return null;
}
