import type { Metadata } from "next";

import PlannerPage from "../PlannerPage";

export const metadata: Metadata = {
  title: "Weekly Vegan Shopping List",
};

export default function ShoppingListPage() {
  return <PlannerPage view="shopping" />;
}
