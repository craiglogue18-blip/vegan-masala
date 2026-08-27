# Vegan Masala App Store preparation

This document contains a working App Store listing and the checks that can be completed before joining the Apple Developer Program.

## Proposed listing

- **Name:** Vegan Masala
- **Subtitle:** Plan, shop and cook vegan meals
- **Primary category:** Food & Drink
- **Secondary category:** Lifestyle
- **Bundle ID:** `com.veganmasala.planner`
- **Age rating:** 4+ (subject to the final App Store Connect questionnaire)
- **Price:** Free for the first release
- **Support URL:** `https://www.vegan-masala.com/contact`
- **Marketing URL:** `https://www.vegan-masala.com/meal-planner`
- **Privacy policy URL:** Use the published Vegan Masala privacy-policy page after it has been reviewed against the app behaviour below.

### Promotional text

Turn Vegan Masala recipes into a personal weekly plan, one practical shopping list and a calm step-by-step cooking experience.

### Description

Vegan Masala helps you decide what to cook and get everything you need in one place.

Build a meal plan around your household and preferences, keep it on your device, and return to it throughout the week. Your chosen recipes become a grouped shopping list so you can see what you already have and what you still need to buy.

When it is time to cook, open a recipe in focused cooking mode. Work through clear steps, check ingredients as you go and use the built-in step timer where a recipe provides a cooking time.

Features in the first release:

- Personalised meal planning for breakfast, lunch and dinner
- Saved plans that remain available when you return
- Shopping lists grouped by supermarket section
- “Have”, “Need” and “Skip” ingredient tracking
- Native sharing for taking a list to the supermarket
- Searchable recipe selection
- Step-by-step cooking mode with timers
- Profile preferences stored on your device

No account is required for this first version.

### Keywords

`vegan,meal planner,recipes,shopping list,plant based,Indian,cooking,dinner,weekly plan`

### Review notes draft

No sign-in is required. Open the app, complete or skip the welcome questions, then choose **Build plan**. Plans, preferences and shopping status are stored locally on the device. The **Website** link deliberately opens the public Vegan Masala website outside the planner experience.

## Privacy working notes

Current planner behaviour should be checked again immediately before submission:

- Name, household size, meal preferences, saved plan and shopping status are stored locally in browser/app storage.
- The planner currently has no user account and does not intentionally transmit that personalisation data to Vegan Masala.
- Advertising and Meta tracking components are excluded from `/meal-planner` routes.
- Recipe images and content are loaded from the Vegan Masala website because this beta uses the production planner URL.
- Website pages opened from the app may have different cookies or analytics and open separately from the planner.
- No payment or subscription system is included in version 1.

Do not make final App Privacy declarations from this draft alone. Perform a network/privacy audit of the exact archived release and ensure the published privacy policy describes the same behaviour.

## Screenshot plan

Capture these on the largest required iPhone display first, then the smaller required size shown in App Store Connect:

1. Welcome screen — “Your personal vegan meal planner”
2. Weekly plan — several days and meal types visible
3. Recipe chooser — searchable recipe selection
4. Shopping list — grouped sections with Have/Need controls
5. Cooking mode — a clear recipe step and timer

Avoid screenshots containing development addresses, simulator chrome, incomplete recipe data or private personal details.

## Ready before enrolment

- [x] Stable bundle identifier selected
- [x] iOS project generated
- [x] Branded app icon and launch assets generated
- [x] Simulator build and launch proven
- [x] Native share sheet integration added
- [x] Native timer haptic integration added
- [x] External website links routed outside the planner
- [x] Draft store copy, keywords, privacy notes and screenshot plan prepared
- [ ] Deploy the planner branch to the production URL
- [ ] Test the production build on a physical iPhone
- [ ] Capture final App Store screenshots
- [ ] Review and publish a matching privacy policy

## Requires Apple Developer Program access

- Create the App Store Connect app record
- Select the development team and enable automatic signing in Xcode
- Produce a signed archive
- Upload the build to TestFlight
- Complete App Privacy, age-rating, content-rights and export-compliance questions
- Add final screenshots and submit the release for review
