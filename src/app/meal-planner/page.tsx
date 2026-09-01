import type { Metadata } from "next";

import PlannerPage from "./PlannerPage";

export const metadata: Metadata = {
  title: "Free Vegan Meal Planner",
  description:
    "Create a simple vegan meal plan from Vegan Masala recipes. Choose your household size, days, meals and cooking preference.",
  alternates: { canonical: "/meal-planner" },
};

export default function MealPlannerPage() {
  return <PlannerPage view="dashboard" />;
}
