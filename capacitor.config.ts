import type { CapacitorConfig } from "@capacitor/cli";

const appUrl = process.env.CAPACITOR_SERVER_URL ?? "https://www.vegan-masala.com/meal-planner";

const config: CapacitorConfig = {
  appId: "com.veganmasala.planner",
  appName: "Vegan Masala",
  webDir: "native-shell",
  server: {
    url: appUrl,
    cleartext: appUrl.startsWith("http://"),
    allowNavigation: ["vegan-masala.com", "www.vegan-masala.com", "localhost"],
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
};

export default config;
