import type { Metadata } from "next";

import WelcomeProfile from "./WelcomeProfile";

export const metadata: Metadata = {
  title: "Welcome | Vegan Masala Meal Planner",
  description: "Personalise your Vegan Masala meal planner.",
};

export default function WelcomePage() {
  return <WelcomeProfile />;
}
