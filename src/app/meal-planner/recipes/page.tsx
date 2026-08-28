import type { Metadata } from "next";

import PlannerPage from "../PlannerPage";

export const metadata: Metadata = {
  title: "Vegan Recipes",
};

export default function PlannerRecipesPage() {
  return <PlannerPage view="recipes" />;
}
