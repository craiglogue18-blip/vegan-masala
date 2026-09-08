export type CampaignKind =
  | "affiliate"
  | "ingredient"
  | "technique"
  | "mistake"
  | "behind-the-recipe"
  | "meal-planner"
  | "dinner-plan";

export type CampaignFormat = "story" | "video";

export type CampaignDefinition = {
  id: CampaignKind;
  label: string;
  description: string;
  source: "none" | "recipe" | "recipe-or-guide";
};

export const CAMPAIGNS: CampaignDefinition[] = [
  {
    id: "affiliate",
    label: "Spice Kitchen spotlight",
    description: "An honestly disclosed partner feature that sends visitors to the Vegan Masala spice guide.",
    source: "none",
  },
  {
    id: "ingredient",
    label: "Ingredient spotlight",
    description: "Teach one useful fact about a spice or ingredient found in the selected recipe.",
    source: "recipe",
  },
  {
    id: "technique",
    label: "Cooking technique",
    description: "Turn a real recipe step into a practical, save-worthy cooking lesson.",
    source: "recipe-or-guide",
  },
  {
    id: "mistake",
    label: "Common mistake",
    description: "Explain one avoidable cooking mistake using the selected content as the source.",
    source: "recipe-or-guide",
  },
  {
    id: "behind-the-recipe",
    label: "Behind the recipe",
    description: "Show the real process, texture or decision behind a finished Vegan Masala dish.",
    source: "recipe",
  },
  {
    id: "meal-planner",
    label: "Meal planner",
    description: "Promote the website meal planner as a practical answer to dinner indecision.",
    source: "none",
  },
  {
    id: "dinner-plan",
    label: "Free dinner plan",
    description: "Promote the free seven-day dinner plan with a clear, low-friction benefit.",
    source: "none",
  },
];
