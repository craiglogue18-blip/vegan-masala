import type { Recipe } from "@/lib/recipes";

export type AppHealthSeverity = "blocker" | "warning" | "improvement";

export type AppHealthIssue = {
  severity: AppHealthSeverity;
  area: "Planning" | "Shopping" | "Cooking" | "Recipe" | "Video";
  message: string;
};

export type RecipeAppHealth = {
  recipe: Recipe;
  issues: AppHealthIssue[];
  ingredients: string[];
  steps: string[];
  videoCount: number;
  score: number;
  status: "Needs attention" | "Usable" | "App ready";
};

export const APP_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "side", "dessert"] as const;
const VALID_MEAL_TYPES = new Set<string>(APP_MEAL_TYPES);
const BREAKFAST_FRIENDLY = /\b(dosa|poori|breakfast|overnight oats|porridge|upma|poha)\b/i;
const DESSERT = /\b(kheer|pudding|sweet|dessert|jalebi|gulab jamun|rasgulla|barfi|katli|balls)\b/i;
const SIDE = /\b(chutney|naan|chapati|roti|rice|salad|raita)\b/i;
const SNACK = /\b(pakora|bhaji|samosa|tikki|vada pav|gobi 65|cauliflower 65)\b/i;
const SIDE_OR_SWEET = /\b(chutney|naan|chapati|roti|pakora|bhaji|poori|salad|raita|kheer|pudding|sweet|dessert|jalebi|gulab jamun|rasgulla|barfi|katli)\b/i;
const UNLIKELY_BREAKFAST = /\b(madras|vindaloo|tikka masala|korma|curry|stew|balti|dhansak|makhani|makhanwala|pasanda)\b/i;
const FLEXIBLE_QUANTITY = /\b(to taste|as needed|for serving|for garnish|for frying|a pinch|pinch of|a handful|handful of)\b/i;
const STARTS_WITH_QUANTITY = /^(?:\d|[¼½¾⅓⅔⅛]|a\s+(?:small|medium|large|thumb)|one\b|juice\s+of|zest\s+of)/i;

function markdownList(value: string | undefined, numbered: boolean) {
  if (!value) return [];
  const pattern = numbered ? /^\d+\.\s+/ : /^[-*+]\s+/;
  return value.split("\n").map((line) => line.trim()).filter((line) => pattern.test(line)).map((line) => line.replace(pattern, "").trim()).filter(Boolean);
}

function issue(severity: AppHealthSeverity, area: AppHealthIssue["area"], message: string): AppHealthIssue {
  return { severity, area, message };
}

export function analyseRecipeAppHealth(recipe: Recipe): RecipeAppHealth {
  const issues: AppHealthIssue[] = [];
  const ingredients = recipe.ingredients?.length ? recipe.ingredients : markdownList(recipe.ingredientsMarkdown, false);
  const steps = recipe.instructions?.length ? recipe.instructions : markdownList(recipe.methodMarkdown, true);
  const mealTypes = (recipe.mealTypes ?? []).map((value) => value.toLowerCase());
  const servings = recipe.servings ?? recipe.serves;
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const videoCount = (recipe.stepVideos ?? []).filter(Boolean).length;
  const titleAndTags = [recipe.title, ...(recipe.tags ?? [])].join(" ");

  if (!mealTypes.length) {
    issues.push(issue("blocker", "Planning", "Choose breakfast, lunch and/or dinner instead of relying on automatic guessing."));
  } else {
    const invalid = mealTypes.filter((value) => !VALID_MEAL_TYPES.has(value));
    if (invalid.length) issues.push(issue("blocker", "Planning", `Unsupported meal type: ${invalid.join(", ")}.`));
    if (mealTypes.includes("breakfast") && UNLIKELY_BREAKFAST.test(titleAndTags)) {
      issues.push(issue("warning", "Planning", "Breakfast classification looks unusual and should be checked."));
    }
    if (mealTypes.some((value) => value === "lunch" || value === "dinner") && SIDE_OR_SWEET.test(titleAndTags)) {
      issues.push(issue("warning", "Planning", "This looks like a side, snack or sweet but is classified as a main meal."));
    }
  }

  if (!servings || servings <= 0) issues.push(issue("blocker", "Shopping", "Add a valid serving quantity so household scaling is reliable."));
  if (!ingredients.length) {
    issues.push(issue("blocker", "Shopping", "No structured ingredients are available."));
  } else {
    const quantityReview = ingredients.filter((ingredient) => !STARTS_WITH_QUANTITY.test(ingredient.trim()) && !FLEXIBLE_QUANTITY.test(ingredient));
    if (quantityReview.length) {
      issues.push(issue("warning", "Shopping", `${quantityReview.length} ingredient${quantityReview.length === 1 ? "" : "s"} need a clearer quantity or “as needed” label.`));
    }
  }

  if (!steps.length) {
    issues.push(issue("blocker", "Cooking", "No structured cooking steps are available."));
  } else {
    const shortSteps = steps.filter((step) => step.trim().length < 18).length;
    if (shortSteps) issues.push(issue("warning", "Cooking", `${shortSteps} cooking step${shortSteps === 1 ? " is" : "s are"} too short to guide someone confidently.`));
  }

  if (recipe.prepMinutes === undefined || recipe.cookMinutes === undefined) {
    issues.push(issue("warning", "Recipe", "Add both preparation and cooking times."));
  } else if (totalMinutes <= 0 || totalMinutes > 240) {
    issues.push(issue("warning", "Recipe", `The total time of ${totalMinutes} minutes looks unusual.`));
  }
  if (!recipe.image) issues.push(issue("warning", "Recipe", "Add a recipe image for planner and cooking screens."));
  if (!(recipe.plannerTags?.length)) issues.push(issue("improvement", "Planning", "Add planner preferences such as quick, low-cost or high-protein."));

  if (steps.length && videoCount === 0) {
    issues.push(issue("improvement", "Video", `${steps.length} cooking steps are ready for optional visual guides.`));
  } else if (videoCount < steps.length) {
    issues.push(issue("improvement", "Video", `${videoCount} of ${steps.length} cooking steps have a video.`));
  }

  const blockers = issues.filter((item) => item.severity === "blocker").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  const score = Math.max(0, 100 - blockers * 22 - warnings * 8);
  const status = blockers ? "Needs attention" : warnings ? "Usable" : "App ready";

  return { recipe, issues, ingredients, steps, videoCount, score, status };
}

export function suggestRecipeMealTypes(recipe: Recipe): string[] {
  const text = [recipe.title, recipe.slug, ...(recipe.tags ?? [])].join(" ");
  if (DESSERT.test(text)) return ["dessert"];
  if (SIDE.test(text)) return ["side"];
  if (SNACK.test(text)) return ["snack"];
  if (BREAKFAST_FRIENDLY.test(text)) return ["breakfast", "lunch"];
  return ["lunch", "dinner"];
}

export function buildRecipeAppHealth(recipes: Recipe[]) {
  return recipes.map(analyseRecipeAppHealth).sort((a, b) => {
    const blockerDifference = b.issues.filter((item) => item.severity === "blocker").length - a.issues.filter((item) => item.severity === "blocker").length;
    return blockerDifference || a.score - b.score || a.recipe.title.localeCompare(b.recipe.title);
  });
}
