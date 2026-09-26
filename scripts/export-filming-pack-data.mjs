import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = path.resolve(import.meta.dirname, "..");
const output = {};
for (const slug of process.argv.slice(2)) {
  const source = fs.readFileSync(path.join(root, "content", "recipes", `${slug}.mdx`), "utf8");
  output[slug] = matter(source).data;
}
process.stdout.write(JSON.stringify(output));
