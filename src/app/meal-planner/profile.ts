export type PlannerMeal = "Breakfast" | "Lunch" | "Dinner";
export type PlannerPreference = "Any" | "Quick" | "Low cost" | "High protein" | "Family friendly";

export type PlannerProfile = {
  name: string;
  people: number;
  confidence: "New cook" | "Comfortable" | "Confident";
  goal: PlannerPreference;
  spice: "Mild" | "Medium" | "Hot";
  meals: PlannerMeal[];
};

export const PROFILE_KEY = "vegan-masala-profile-v1";
export const PROFILE_SKIPPED_KEY = "vegan-masala-profile-skipped-v1";

export const DEFAULT_PROFILE: PlannerProfile = {
  name: "",
  people: 2,
  confidence: "Comfortable",
  goal: "Any",
  spice: "Medium",
  meals: ["Breakfast", "Lunch", "Dinner"],
};

export function readPlannerProfile(): PlannerProfile | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null") as Partial<PlannerProfile> | null;
    if (!saved || typeof saved.people !== "number" || !Array.isArray(saved.meals)) return null;
    return { ...DEFAULT_PROFILE, ...saved };
  } catch {
    localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}
