import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RECIPES_DIR = path.join(ROOT, "content", "recipes");

function stripSourceMetadata(raw) {
  return raw.replace(
    /^sourceImage:\s*(?:[>|][+-]?\s*\n(?:[ \t]+[^\n]*(?:\n|$))+|[^\n]*(?:\n|$))/gm,
    ""
  );
}

function recipeFiles() {
  const fileIndex = process.argv.indexOf("--file");
  if (fileIndex >= 0) {
    const supplied = process.argv[fileIndex + 1];
    if (!supplied) throw new Error("--file requires a recipe path.");
    return [path.resolve(ROOT, supplied)];
  }

  return fs
    .readdirSync(RECIPES_DIR)
    .filter((file) => /\.mdx?$/i.test(file))
    .map((file) => path.join(RECIPES_DIR, file));
}

let changed = 0;
for (const file of recipeFiles()) {
  const before = fs.readFileSync(file, "utf8");
  const after = stripSourceMetadata(before);
  if (after === before) continue;
  fs.writeFileSync(file, after, "utf8");
  changed += 1;
}

console.log(`Removed imported source metadata from ${changed} recipe file${changed === 1 ? "" : "s"}.`);
