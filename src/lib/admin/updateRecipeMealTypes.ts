import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { RECIPES_DIR } from "@/lib/recipes";

function recipeFileForSlug(slug: string) {
  const files = fs.readdirSync(RECIPES_DIR).filter((file) => /\.mdx?$/i.test(file));
  for (const file of files) {
    const filePath = path.join(RECIPES_DIR, file);
    const parsed = matter(fs.readFileSync(filePath, "utf8"));
    const fileSlug = typeof parsed.data.slug === "string" ? parsed.data.slug : file.replace(/\.mdx?$/i, "");
    if (fileSlug === slug) return filePath;
  }
  return null;
}

function updateFrontmatterLine(filePath: string, key: string, replacement: string, insertAfter: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const boundary = raw.indexOf("\n---", 3);
  if (!raw.startsWith("---") || boundary === -1) throw new Error("Recipe frontmatter is invalid.");

  const header = raw.slice(4, boundary);
  const body = raw.slice(boundary);
  const lines = header.split("\n");
  const existing = lines.findIndex((line) => new RegExp(`^${key}\\s*:`).test(line));

  if (existing >= 0) {
    let end = existing + 1;
    while (end < lines.length && /^\s+-\s+/.test(lines[end])) end += 1;
    lines.splice(existing, end - existing, replacement);
  } else {
    const anchor = lines.findIndex((line) => new RegExp(`^${insertAfter}\\s*:`).test(line));
    let insertAt = anchor >= 0 ? anchor + 1 : lines.length;
    while (insertAt < lines.length && /^\s+-\s+/.test(lines[insertAt])) insertAt += 1;
    lines.splice(insertAt, 0, replacement);
  }

  fs.writeFileSync(filePath, `---\n${lines.join("\n")}${body}`, "utf8");
}

function updateRecipeArray(slug: string, key: string, values: Array<string | null>, insertAfter: string) {
  const filePath = recipeFileForSlug(slug);
  if (!filePath) throw new Error("Recipe not found.");
  updateFrontmatterLine(filePath, key, `${key}: [${values.map((value) => value === null ? "null" : JSON.stringify(value)).join(", ")}]`, insertAfter);
  return path.basename(filePath);
}

export function updateRecipeMealTypes(slug: string, mealTypes: string[]) {
  const filePath = recipeFileForSlug(slug);
  if (!filePath) throw new Error("Recipe not found.");

  updateFrontmatterLine(filePath, "mealTypes", `mealTypes: [${mealTypes.join(", ")}]`, "tags");
  return path.basename(filePath);
}

export function updateRecipeServings(slug: string, servings: number) {
  const filePath = recipeFileForSlug(slug);
  if (!filePath) throw new Error("Recipe not found.");
  const data = matter(fs.readFileSync(filePath, "utf8")).data;
  const key = Object.prototype.hasOwnProperty.call(data, "serves") && !Object.prototype.hasOwnProperty.call(data, "servings") ? "serves" : "servings";
  updateFrontmatterLine(filePath, key, `${key}: ${servings}`, "cookMinutes");
  return path.basename(filePath);
}

export function updateRecipePlannerTags(slug: string, tags: string[]) {
  return updateRecipeArray(slug, "plannerTags", tags, "mealTypes");
}

export function updateRecipeIngredients(slug: string, ingredients: string[]) {
  return updateRecipeArray(slug, "ingredients", ingredients, "socialHook");
}

export function updateRecipeStepVideos(slug: string, videos: Array<string | null>) {
  return updateRecipeArray(slug, "stepVideos", videos, "instructions");
}
