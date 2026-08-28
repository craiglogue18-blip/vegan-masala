import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const recipesDir = path.join(process.cwd(), "content", "recipes");
const apply = process.argv.includes("--apply");

const dessert = /\b(jalebi|gulab jamun|rasgulla|kheer|pudding|barfi|katli|peanut and coconut balls)\b/i;
const side = /\b(chutney|chapati|naan|roti|kachumber|salad)\b/i;
const snack = /\b(bread pakora|aloo pakora|vegetable pakora|aloo tikki|cauliflower 65|onion bhaji|samosas|vada pav)\b/i;
const ambiguous = /\b(rice|poori|tandoori gobi|tofu kondattam|spiced roasted cauliflower)\b/i;
const main = /\b(curry|dal|dahl|masala|aloo|tofu|beans?|chickpeas?|chana|chole|sambar|stew|soup|biryani|kurma|makhanwala|balti|bhuna|bhindi|dhansak|vindaloo|madras|tarkari|kofta|kadhi|matar|palak|saag|jackfruit|brinjal|aubergine|korma)\b/i;

function classification(title) {
  if (dessert.test(title)) return ["dessert"];
  if (side.test(title)) return ["side"];
  if (/\bdosa\b/i.test(title)) return ["breakfast", "lunch"];
  if (/\bsamosa pie\b|\bkadhi pakora\b/i.test(title)) return ["lunch", "dinner"];
  if (snack.test(title)) return ["snack"];
  if (ambiguous.test(title)) return null;
  if (main.test(title)) return ["lunch", "dinner"];
  return null;
}

function upsert(raw, key, value, after) {
  const boundary = raw.indexOf("\n---", 3);
  if (!raw.startsWith("---") || boundary === -1) return raw;
  const lines = raw.slice(4, boundary).split("\n");
  const existing = lines.findIndex((line) => new RegExp(`^${key}\\s*:`).test(line));
  if (existing >= 0) return raw;
  const anchor = lines.findIndex((line) => new RegExp(`^${after}\\s*:`).test(line));
  let insertAt = anchor >= 0 ? anchor + 1 : lines.length;
  while (insertAt < lines.length && /^\s+-\s+/.test(lines[insertAt])) insertAt += 1;
  lines.splice(insertAt, 0, `${key}: ${value}`);
  return `---\n${lines.join("\n")}${raw.slice(boundary)}`;
}

const results = { classified: [], servingsAdded: [], review: [] };
for (const file of fs.readdirSync(recipesDir).filter((name) => /\.mdx?$/i.test(name))) {
  const filePath = path.join(recipesDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = matter(raw).data;
  const title = String(data.title || file);
  const mealTypes = classification(title);
  if (!mealTypes) { results.review.push(title); continue; }

  let next = raw;
  if (!Array.isArray(data.mealTypes) || !data.mealTypes.length) {
    next = upsert(next, "mealTypes", `[${mealTypes.join(", ")}]`, "tags");
    results.classified.push({ title, mealTypes });
  }
  if (mealTypes.includes("dinner") && !(Number(data.servings) > 0) && !(Number(data.serves) > 0)) {
    next = upsert(next, "servings", "4", "cookMinutes");
    results.servingsAdded.push(title);
  }
  if (apply && next !== raw) fs.writeFileSync(filePath, next, "utf8");
}

console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", ...results }, null, 2));
