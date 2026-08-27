# Vegan Masala native app

The iOS beta is packaged with Capacitor using bundle identifier `com.veganmasala.planner`.

## Before running

The native shell loads the deployed meal planner. Until the `meal-planner-v1` branch is deployed, provide a reachable development address:

```bash
CAPACITOR_SERVER_URL=http://YOUR-MAC-IP:3001/meal-planner npm run native:sync
```

Do not submit a build that still points at a local address. The default production address is `https://www.vegan-masala.com/meal-planner`.

## Prepare iOS

```bash
npm run native:assets
npm run native:sync
npm run native:open:ios
```

In Xcode, select the App target and configure the Apple development team. Install the current iOS platform from **Xcode → Settings → Components** if no simulator or device destination appears.

## Release checklist

- Deploy and verify the production meal planner URL.
- Test onboarding, planning, shopping, cooking mode, timers and offline recovery on a real iPhone.
- Confirm app links open external website pages in the system browser.
- Confirm no AdSense or Meta Pixel requests occur on `/meal-planner` routes.
- Replace provisional store copy and screenshots with final reviewed assets.
- Complete App Privacy details based on the production build.
- Archive in Xcode and upload to TestFlight before requesting App Store review.

Android has intentionally not been generated yet because the local Java/Android SDK toolchain is absent. Validate the iOS beta first, then add `@capacitor/android` and run `npx cap add android`.
