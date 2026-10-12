import RecipeLaunchPackClient, { type RecipeOption } from "./RecipeLaunchPackClient";

import { allContent, slugFromFile, titleFromSlug } from "@/lib/social/core/content";

export default function RecipeLaunchPackPage() {
  const recipes: RecipeOption[] = allContent()
    .filter((item) => item.type === "recipe")
    .map((item) => {
      const slug = slugFromFile(item.file);
      return { slug, label: titleFromSlug(slug) };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  return <RecipeLaunchPackClient recipes={recipes} />;
}
