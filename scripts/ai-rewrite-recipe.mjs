#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import OpenAI from "openai";

const RECIPES_DIR = path.join(process.cwd(), "content", "recipes");
const STAGING_DIR = path.join(process.cwd(), "content", "recipes_rewritten");

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function printHelp() {
  console.log(`
AI Recipe Rewrite (Vegan Masala)

USAGE
  node scripts/ai-rewrite-recipe.mjs --latest
  node scripts/ai-rewrite-recipe.mjs --file content/recipes/chana-masala.mdx
  node scripts/ai-rewrite-recipe.mjs --slug chana-masala

OPTIONS
  --latest
  --file <path>
  --slug <slug>
  --model <name>      Default: OPENAI_RECIPE_MODEL or gpt-5.4-mini
  --dry-run
  --no-write
  --no-backup
  --write-live       Explicitly write the reviewed result to the live recipe file.
                     Without this flag, output is staged in content/recipes_rewritten.
`);
}

function getAllRecipePaths() {
  if (!fs.existsSync(RECIPES_DIR)) die(`Missing folder: ${RECIPES_DIR}`);
  return fs
    .readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => path.join(RECIPES_DIR, f));
}

function getLatestRecipePath() {
  const files = getAllRecipePaths();
  if (!files.length) die("No recipe files found.");
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

function findRecipeBySlug(slug) {
  const files = getAllRecipePaths();
  for (const p of files) {
    const raw = fs.readFileSync(p, "utf8");
    const { data } = matter(raw);
    if (String(data?.slug || "").trim() === slug) return p;
  }
  return null;
}

function cleanArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x).trim()).filter(Boolean);
}

function buildBody({ ingredients, instructions, notes }) {
  const bullets = (items) => items.map((x) => `- ${x}`).join("\n");
  const numbered = (items) => items.map((x, i) => `${i + 1}. ${x}`).join("\n");

  return [
    "## Ingredients",
    ingredients.length ? bullets(ingredients) : "-",
    "",
    "## Method",
    instructions.length ? numbered(instructions) : "1. ",
    "",
    "## Notes",
    notes.length ? bullets(notes) : "-",
    "",
  ].join("\n");
}

function extractSection(content, headingNames) {
  const names = headingNames.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(^|\\n)##\\s+(${names})\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|\\s*$)`, "i");
  const m = re.exec(content);
  return m ? String(m[3] || "").trim() : "";
}

function parseBullets(block) {
  return String(block || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-+\s+/, "").trim())
    .filter(Boolean);
}

function parseNumbered(block) {
  return String(block || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
}

function validateRewrite(rewritten, original) {
  const description = String(rewritten?.description || "").trim();
  const ingredients = cleanArray(rewritten?.ingredients);
  const instructions = cleanArray(rewritten?.instructions);
  const notes = cleanArray(rewritten?.notes);
  const introNote = String(rewritten?.introNote || "").trim();
  const servingSuggestion = String(rewritten?.servingSuggestion || "").trim();

  const problems = [];
  if (description.length < 50 || description.length > 160) {
    problems.push("description must be 50–160 characters");
  }
  if (ingredients.length !== original.ingredients.length) {
    problems.push(`ingredient count changed (${original.ingredients.length} → ${ingredients.length})`);
  }
  if (instructions.length < Math.max(3, Math.ceil(original.instructions.length * 0.75))) {
    problems.push("too many method steps were removed");
  }
  if (notes.length < 2 || notes.length > 6) problems.push("notes must contain 2–6 useful items");
  if (introNote.length < 30 || introNote.length > 220) problems.push("introNote must be 30–220 characters");
  if (servingSuggestion.length < 20 || servingSuggestion.length > 180) {
    problems.push("servingSuggestion must be 20–180 characters");
  }

  if (problems.length) die(`OpenAI response failed validation:\n- ${problems.join("\n- ")}`);

  return { description, ingredients, instructions, notes, introNote, servingSuggestion };
}

function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const noWrite = args.includes("--no-write");
  const noBackup = args.includes("--no-backup");
  const writeLive = args.includes("--write-live");

  const modelIdx = args.indexOf("--model");
  const model =
    modelIdx !== -1
      ? args[modelIdx + 1]
      : process.env.OPENAI_RECIPE_MODEL?.trim() || "gpt-5.4-mini";

  const fileIdx = args.indexOf("--file");
  const slugIdx = args.indexOf("--slug");

  let filePath = fileIdx !== -1 ? args[fileIdx + 1] : null;
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : null;

  if (!filePath && slug) {
    filePath = findRecipeBySlug(slug);
    if (!filePath) die(`Could not find recipe with slug: ${slug}`);
  }

  if (!filePath && args.includes("--latest")) {
    filePath = getLatestRecipePath();
  }

  if (!filePath) die("Use --latest, --file <path> or --slug <slug>.");

  if (!path.isAbsolute(filePath)) filePath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(filePath)) die(`File not found: ${filePath}`);

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const ingredientsFromFrontmatter = cleanArray(data.ingredients);
  const instructionsFromFrontmatter = cleanArray(data.instructions);
  const notesFromFrontmatter = cleanArray(data.notes);

  const ingredients =
    ingredientsFromFrontmatter.length > 0
      ? ingredientsFromFrontmatter
      : parseBullets(extractSection(content, ["Ingredients", "Ingredient"]));

  const instructions =
    instructionsFromFrontmatter.length > 0
      ? instructionsFromFrontmatter
      : parseNumbered(extractSection(content, ["Method", "Instructions", "Instruction"]));

  const notes =
    notesFromFrontmatter.length > 0
      ? notesFromFrontmatter
      : parseBullets(extractSection(content, ["Notes", "Tips"]));

  const payload = {
    frontmatter: {
      title: data.title || "",
      slug: data.slug || "",
      description: data.description || "",
      cuisine: data.cuisine || "",
      prepMinutes: data.prepMinutes ?? null,
      cookMinutes: data.cookMinutes ?? null,
      servings: data.servings ?? data.serves ?? null,
      diet: Array.isArray(data.diet) ? data.diet : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      image: data.image || "",
      publishedAt: data.publishedAt || "",
      introNote: data.introNote || "",
      servingSuggestion: data.servingSuggestion || "",
    },
    ingredients,
    instructions,
    notes,
  };

  const systemPrompt = `
You are rewriting recipe content for a website called Vegan Masala.

Vegan Masala is a vegan Indian cooking site with a warm, professional, family-oriented voice.
The writing should feel knowledgeable, grounded and natural, like it was written by a person with real experience of Indian cooking at home and at the table.

The site voice must be:
- vegan-first
- professional but warm
- family-oriented without cliché
- confident about Indian cooking technique
- specific about flavour, texture and method
- subtle, calm and human
- never generic, never woolly, never fake-cheffy

Do not use meta-writing phrases such as:
- "written in the style of"
- "this recipe is written to"
- "this page is designed to"
- "the goal of this recipe is"
- "this recipe is meant to"
- "this dish is all about"
- "what makes this recipe special"
- "expect"
- "flavour-packed"
- "packed with flavour"
- "perfect weeknight meal"
- "delicious and comforting"
- "restaurant-quality"
- "comes together beautifully"

Do not describe the writing style inside the recipe copy.
Do not explain the tone.
Do not sound like an AI trying to sound authentic.

Important writing rules:
- Vegan is central, not an afterthought.
- The tone should feel experienced and grounded, like someone who knows Indian cooking deeply and cares about family-style food.
- Prefer specific language about onion cooking, tomato reduction, blooming spices, texture, body, masala, aroma, simmering and seasoning.
- Use restrained warmth. Let family-table feeling come through naturally, without overdoing nostalgia.
- Ingredients must be listed in the order they are first used.
- Method steps must mention ingredient quantities when those ingredients are first introduced.
- Never reuse one measured ingredient quantity in separate steps. If an ingredient is divided between steps, label it "divided" in the ingredients and clearly allocate portions in the method without making their total exceed the listed quantity.
- Notes should contain real cooking judgment, storage, reheating, texture and serving guidance — not fluff.
- Do not invent elaborate cultural claims.
- Do not overclaim authenticity.
- Keep the writing clear, clean and publishable.
- Keep descriptions concise and believable.
- Avoid sounding promotional.

Description guidance:
- Write 2 sentences maximum.
- Keep the complete description between 50 and 160 characters.
- Sentence 1 should explain the dish clearly and concretely.
- Sentence 2 should suggest flavour, texture or serving context in a natural way.
- Do not use hype language.

Instructions guidance:
- Be direct and practical.
- Tell the cook what to look for where useful.
- Use natural kitchen language.
- Avoid filler.

Notes guidance:
- Focus on real usefulness.
- Include texture, reheating, leftovers, serving or adjustment notes where helpful.
- Avoid repeating the method.

Intro note guidance:
- Write 1 to 2 sentences.
- It should feel personal, natural and recipe-specific.
- Do not use "expect" or obvious AI filler.
- This text appears in the "What to expect" area on the recipe page.

Serving suggestion guidance:
- Write 1 sentence.
- Keep it practical and natural.
- Suggest simple sides or serving context that fits the dish.

Return data matching exactly this structure:
{
  "description": string,
  "ingredients": string[],
  "instructions": string[],
  "notes": string[],
  "introNote": string,
  "servingSuggestion": string
}
`;

  const userPrompt = `
Rewrite this recipe for Vegan Masala.

Current recipe data:
${JSON.stringify(payload, null, 2)}

Requirements:
1. Rewrite the description in the Vegan Masala voice, using 50 to 160 characters.
2. Reorder ingredients into order of use.
3. Rewrite instructions so the first mention of ingredients includes quantities.
4. Keep the recipe practical and realistic.
5. Improve the notes.
6. Do not remove important ingredients.
7. Do not make the tone generic.
8. Write a short, unique introNote for the recipe page.
9. Write a short, practical servingSuggestion.
10. Check that every measured quantity is used only once in total, unless the ingredient is explicitly marked "divided" and its portions are clearly allocated.

Return only the requested structured data.
`;

  if (dryRun) {
    console.log("DRY RUN");
    console.log(userPrompt);
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) die("Missing OPENAI_API_KEY in .env.local");

  const client = new OpenAI({ apiKey });

  const res = await client.responses.create({
    model,
    store: false,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "vegan_masala_recipe_improvement",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            description: { type: "string" },
            ingredients: { type: "array", items: { type: "string" } },
            instructions: { type: "array", items: { type: "string" } },
            notes: { type: "array", items: { type: "string" } },
            introNote: { type: "string" },
            servingSuggestion: { type: "string" },
          },
          required: [
            "description",
            "ingredients",
            "instructions",
            "notes",
            "introNote",
            "servingSuggestion",
          ],
        },
      },
    },
  });

  if (!res.output_text) die("OpenAI returned no recipe content");
  const rewritten = validateRewrite(JSON.parse(res.output_text), {
    ingredients,
    instructions,
  });

  const nextData = {
    ...data,
    description: String(rewritten.description || "").trim(),
    ingredients: cleanArray(rewritten.ingredients),
    instructions: cleanArray(rewritten.instructions),
    notes: cleanArray(rewritten.notes),
    introNote: String(rewritten.introNote || "").trim(),
    servingSuggestion: String(rewritten.servingSuggestion || "").trim(),
  };

  const nextBody = buildBody({
    ingredients: nextData.ingredients,
    instructions: nextData.instructions,
    notes: nextData.notes,
  });

  const out = matter.stringify(nextBody, nextData);

  if (noWrite) {
    console.log(out);
    return;
  }

  const outputPath = writeLive
    ? filePath
    : path.join(STAGING_DIR, path.basename(filePath));

  if (writeLive && !noBackup) {
    backupFile(outputPath);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, out, "utf8");
  console.log(`✅ ${writeLive ? "Rewrote live recipe" : "Staged for human review"}: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
