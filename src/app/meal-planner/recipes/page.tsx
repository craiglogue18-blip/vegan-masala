import type { Metadata } from "next";

import PlannerPage from "../PlannerPage";

export const metadata: Metadata = {
  title: "Vegan Recipes",
  robots: { index: false, follow: true },
};

export default function PlannerRecipesPage() {
  return <PlannerPage view="recipes" />;
}
