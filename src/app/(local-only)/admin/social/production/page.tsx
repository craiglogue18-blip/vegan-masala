import RawFootageStudioClient, { type RecipeOption } from "./RawFootageStudioClient";

import { allContent, slugFromFile, titleFromSlug } from "@/lib/social/core/content";

export default function RawFootageStudioPage() {
  const recipes: RecipeOption[] = allContent()
    .filter((item) => item.type === "recipe")
    .map((item) => {
      const slug = slugFromFile(item.file);
      return { slug, label: titleFromSlug(slug) };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return <RawFootageStudioClient recipes={recipes} />;
}
