#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import matter from "gray-matter";

const ROOT = process.cwd();
const RECIPES_DIR = path.join(ROOT, "content", "recipes");
const REWRITE_SCRIPT = path.join(ROOT, "scripts", "ai-rewrite-recipe.mjs");

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "") : fallback;
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function scoreRecipe(file) {
  const raw = fs.readFileSync(path.join(RECIPES_DIR, file), "utf8");
  const { data } = matter(raw);
  const reasons = [];
  let score = 0;

  if (!String(data.introNote || "").trim()) {
    score += 3;
    reasons.push("missing recipe-specific introduction");
  }
  if (!String(data.servingSuggestion || "").trim()) {
    score += 3;
    reasons.push("missing serving suggestion");
  }
  if (!Array.isArray(data.notes) || data.notes.length < 2) {
    score += 2;
    reasons.push("thin cooking notes");
  }
  if (!Array.isArray(data.instructions) || data.instructions.length < 4) {
    score += 2;
    reasons.push("short method");
  }
  const descriptionLength = String(data.description || "").trim().length;
  if (descriptionLength < 80 || descriptionLength > 160) {
    score += 1;
    reasons.push(descriptionLength > 160 ? "overlong description" : "short description");
  }

  return { file, slug: String(data.slug || file.replace(/\.mdx?$/, "")), score, reasons };
}

function runRewrite(candidate, { model, dryRun }) {
  return new Promise((resolve) => {
    const args = [REWRITE_SCRIPT, "--file", path.join(RECIPES_DIR, candidate.file)];
    if (model) args.push("--model", model);
    if (dryRun) args.push("--dry-run");
    else args.push("--write-live", "--no-backup");

    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
    });
    child.on("close", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = positiveInteger(argValue("--limit", "2"), 2);
  const model = argValue("--model", process.env.OPENAI_RECIPE_MODEL || "gpt-5.4-mini");

  if (!fs.existsSync(RECIPES_DIR)) throw new Error(`Missing ${RECIPES_DIR}`);
  if (!dryRun && !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const candidates = fs
    .readdirSync(RECIPES_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(scoreRecipe)
    .filter((recipe) => recipe.score > 0)
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, limit);

  if (!candidates.length) {
    console.log("No recipes currently need automated content improvement.");
    return;
  }

  console.log(`Selected ${candidates.length} recipe(s) for ${dryRun ? "review" : "improvement"}:`);
  for (const candidate of candidates) {
    console.log(`- ${candidate.slug}: ${candidate.reasons.join(", ")}`);
  }

  let succeeded = 0;
  for (const candidate of candidates) {
    console.log(`\nImproving ${candidate.slug} with ${model}...`);
    if (await runRewrite(candidate, { model, dryRun })) succeeded += 1;
    else console.error(`Skipped ${candidate.slug}: rewrite or validation failed.`);
  }

  console.log(`\nCompleted ${succeeded}/${candidates.length} recipe improvements.`);
  if (!dryRun && succeeded === 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
