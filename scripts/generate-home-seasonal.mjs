#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ path: process.env.VEGAN_MASALA_ENV_FILE || ".env.local" });

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

const client = new OpenAI({ apiKey });
const response = await client.responses.create({
  model: process.env.OPENAI_RECIPE_MODEL?.trim() || "gpt-5.4-mini",
  input: `Write concise homepage editorial copy for Vegan Masala, a UK vegan Indian recipe website, for late summer moving into early autumn. The feature should encourage cooking with aubergine, spinach, tomato, chickpeas and warming spices. Avoid hype, clichés and health claims. Return JSON only with eyebrow (max 28 chars), title (max 62 chars), description (max 180 chars), and cta (max 26 chars).`,
  text: {
    format: {
      type: "json_schema",
      name: "seasonal_homepage_copy",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          eyebrow: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          cta: { type: "string" },
        },
        required: ["eyebrow", "title", "description", "cta"],
      },
    },
  },
});

const parsed = JSON.parse(response.output_text || "{}");
const output = path.join(process.cwd(), "src", "data", "homeSeasonal.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(parsed, null, 2)}\n`);
console.log(output);
