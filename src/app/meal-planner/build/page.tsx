import type { Metadata } from "next";

import PlannerPage from "../PlannerPage";

export const metadata: Metadata = {
  title: "Build a Vegan Meal Plan",
};

export default function BuildMealPlanPage() {
  return <PlannerPage view="build" />;
}
