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

export function updateRecipeMealTypes(slug: string, mealTypes: string[]) {
  const filePath = recipeFileForSlug(slug);
  if (!filePath) throw new Error("Recipe not found.");

  const raw = fs.readFileSync(filePath, "utf8");
  const boundary = raw.indexOf("\n---", 3);
  if (!raw.startsWith("---") || boundary === -1) throw new Error("Recipe frontmatter is invalid.");

  const header = raw.slice(4, boundary);
  const body = raw.slice(boundary);
  const lines = header.split("\n");
  const existing = lines.findIndex((line) => /^mealTypes\s*:/.test(line));
  const replacement = `mealTypes: [${mealTypes.join(", ")}]`;

  if (existing >= 0) {
    let end = existing + 1;
    while (end < lines.length && /^\s+-\s+/.test(lines[end])) end += 1;
    lines.splice(existing, end - existing, replacement);
  } else {
    const tags = lines.findIndex((line) => /^tags\s*:/.test(line));
    let insertAt = tags >= 0 ? tags + 1 : lines.length;
    while (insertAt < lines.length && /^\s+-\s+/.test(lines[insertAt])) insertAt += 1;
    lines.splice(insertAt, 0, replacement);
  }

  fs.writeFileSync(filePath, `---\n${lines.join("\n")}${body}`, "utf8");
  return path.basename(filePath);
}
