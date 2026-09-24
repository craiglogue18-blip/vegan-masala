// src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getPublicRecipes } from "@/lib/recipes";
import { getAllGuides } from "@/lib/guides";
import { getRecipeImage, isPlaceholderImage } from "@/lib/recipeimages";
import DinnerPlanPromo from "@/components/DinnerPlanPromo";
import TrendingRecipes from "@/components/TrendingRecipes";
import RecipeVideoShowcase from "@/components/RecipeVideoShowcase";
import EthicalShoppingSpotlight from "@/components/EthicalShoppingSpotlight";
import HomepageApronFeature from "@/components/HomepageApronFeature";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.vegan-masala.com";

export const metadata: Metadata = {
  title: "Vegan Indian Recipes & Cooking Guides",
  description:
    "Authentic vegan Indian recipes, curries, dals, flatbreads and practical cooking guides. Learn vegan Indian cooking with clear methods, proper masalas and weeknight-friendly ideas.",
  alternates: {
    canonical: `${siteUrl}/`,
  },
  openGraph: {
    title: "Vegan Indian Recipes & Cooking Guides | Vegan Masala",
    description:
      "Authentic vegan Indian recipes, curries, dals, flatbreads and practical cooking guides.",
    url: `${siteUrl}/`,
    siteName: "Vegan Masala",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vegan Indian Recipes & Cooking Guides | Vegan Masala",
    description:
      "Authentic vegan Indian recipes, curries, dals, flatbreads and practical cooking guides.",
  },
};

function minutes(prep?: number, cook?: number) {
  const total = (prep ?? 0) + (cook ?? 0);
  return total > 0 ? `${total} min` : null;
}

function getGuideImage(slug: string, image?: string) {
  if (image) return image;
  return `/images/guides/${slug}.png`;
}

export default function Home() {
  const recipes = getPublicRecipes();
  const guides = getAllGuides();

  const featuredRecipes = recipes.slice(0, 3);
  const featuredGuides = guides.slice(0, 3);
  const trendingRecipes = recipes.slice(0, 40).map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description || "A flavour-packed recipe from the Vegan Masala kitchen.",
    image: getRecipeImage(recipe.slug),
    totalMinutes: (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0),
  }));

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vegan Masala",
    url: siteUrl,
    logo: `${siteUrl}/apple-touch-icon.png?v=3`,
    sameAs: [
      "https://www.instagram.com/veganmasalaonline/",
      "https://www.youtube.com/@vegan-masala",
      "https://uk.pinterest.com/VeganMasala/",
      "https://www.facebook.com/profile.php?id=61576464682288",
      "https://www.tiktok.com/@user2554050179629?lang=en-GB",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vegan Masala",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/recipes?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const exploreTags = [
    { label: "Tofu", key: "tofu" },
    { label: "Potato", key: "potatoes" },
    { label: "Chickpeas", key: "chickpeas" },
    { label: "Dal & Lentils", key: "dal-and-lentils" },
    { label: "Rice & Biryani", key: "rice" },
    { label: "Eggplant", key: "eggplant" },
    { label: "Spinach", key: "spinach" },
    { label: "Instant Pot", key: "instant-pot" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 pt-6 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 pt-10 pb-16 shadow-sm">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-black/20" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-black/20" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/80">
              Vegan Masala
            </p>

            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-[var(--brand-gold)] sm:text-5xl">
              Find your next unforgettable vegan Indian dinner
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
              Proper masalas, dependable methods and generous family-style food.
              Choose what you are craving and we’ll help make dinner the easy decision.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/recipes"
                className="rounded-xl bg-[var(--brand-red)] px-6 py-3 font-bold text-white shadow transition hover:opacity-90"
              >
                Explore the recipes
              </Link>

              <a
                href="/dinner-plan?utm_source=vegan-masala&utm_medium=website&utm_campaign=7-day-dinner-plan&utm_content=homepage-hero"
                className="rounded-xl border border-[var(--border)] bg-black/10 px-6 py-3 font-bold text-[var(--brand-gold)] transition hover:bg-black/20"
              >
                Get the free dinner plan
              </a>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-[var(--text-soft)] sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3">
                ✓ Vegan-first Indian cooking
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3">
                ✓ Family-style recipes and guides
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3">
                ✓ Proper flavour, not shortcuts
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3">
                ✓ Written for serious curry lovers
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-black/20 shadow-lg">
              <div className="relative aspect-[4/4.5] w-full">
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/images/hero-curry.jpg"
                  aria-label="A montage of colourful vegan Indian dishes"
                >
                  <source media="(max-width: 640px)" src="/videos/home-hero-mobile.mp4" type="video/mp4" />
                  <source src="/videos/home-hero-desktop.mp4" type="video/mp4" />
                </video>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden max-w-[250px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm sm:block">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]">
                Family-table cooking
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                Vegan Indian food with the warmth, depth and generosity that
                make home cooking memorable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="vm-rise mt-10 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/40 bg-[var(--surface)] shadow-sm">
        <div className="grid items-center gap-6 p-7 sm:p-9 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/75">
              Need help choosing dinner?
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Plan meals without cluttering the kitchen table
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--text-soft)]">
              Use the dedicated Meal Planner to choose recipes, organise the week
              and build a practical shopping list in one place.
            </p>
          </div>
          <Link
            href="/meal-planner"
            className="inline-flex w-fit rounded-xl bg-[var(--brand-red)] px-6 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Open the Meal Planner
          </Link>
        </div>
      </section>

      <TrendingRecipes recipes={trendingRecipes} />

      {/* FEATURED RECIPES */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
              Start with these
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">
              Recipes worth starting with
            </h2>
          </div>

          <Link
            href="/recipes"
            className="text-sm font-bold text-[var(--text-soft)] hover:underline"
          >
            Browse all →
          </Link>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {featuredRecipes.map((recipe) => {
            const img = getRecipeImage(recipe.slug);
            const placeholder = isPlaceholderImage(img);
            const time = minutes(recipe.prepMinutes, recipe.cookMinutes);

            return (
              <Link
                key={recipe.slug}
                href={`/recipes/${recipe.slug}`}
                className="group overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:bg-black/20"
              >
                <div className="relative h-60 w-full bg-black/25">
                  <Image
                    src={img}
                    alt={recipe.title}
                    fill
                    className={
                      placeholder ? "object-contain p-10 opacity-90" : "object-cover"
                    }
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />

                  {time ? (
                    <div className="absolute right-4 top-4 rounded-xl bg-[var(--brand-red)] px-3 py-1 text-xs font-extrabold text-white shadow">
                      {time}
                    </div>
                  ) : null}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-extrabold text-[var(--brand-gold)] group-hover:underline">
                    {recipe.title}
                  </h3>

                  {recipe.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">
                      {recipe.description}
                    </p>
                  ) : null}

                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <RecipeVideoShowcase />

      <div className="mt-12">
        <DinnerPlanPromo placement="homepage" />
      </div>

      {/* FEATURED GUIDES */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
              Learn the cooking
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">
              Guides for better Indian cooking
            </h2>
          </div>

          <Link
            href="/guides"
            className="text-sm font-bold text-[var(--text-soft)] hover:underline"
          >
            View all guides →
          </Link>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:bg-black/20"
            >
              <div className="relative h-52 w-full bg-black/25">
                <Image
                  src={getGuideImage(guide.slug, guide.image)}
                  alt={guide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>

              <div className="p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]/70">
                  Guide
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-[var(--brand-gold)] group-hover:underline">
                  {guide.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  {guide.description ||
                    "Practical help for building confidence with vegan Indian cooking."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <HomepageApronFeature />

      <EthicalShoppingSpotlight />

      {/* EXPLORE BY INGREDIENT */}
      <section className="mt-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
          Build flavour
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">
          Browse by ingredient
        </h2>

        <div className="mt-5 flex flex-wrap gap-3">
          {exploreTags.map((t) => (
            <Link
              key={t.key}
              href={`/recipes?tag=${encodeURIComponent(t.key)}`}
              className="rounded-xl border border-[var(--border)] bg-black/10 px-4 py-2 text-sm font-extrabold text-[var(--brand-gold)] transition hover:bg-black/20"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT / BRAND */}
      <section className="relative mt-12 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/45 bg-[var(--surface)] p-8 shadow-sm sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/mandala-pattern.png')] bg-repeat opacity-[0.035]"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
              Meet the person behind Vegan Masala
          </p>
            <h2 className="mt-2 text-3xl font-extrabold text-white">
              Hello, I&apos;m Craig
          </h2>
            <p className="mt-4 max-w-3xl leading-8 text-[var(--text-soft)]">
              I&apos;m a Bristol-based home cook, originally from Wales, with a
              lifelong love of curry. I created Vegan Masala to share generous
              plant-based Indian food without compromising on the warmth, spice
              or satisfaction that made me love these dishes in the first place.
            </p>
            <p className="mt-3 max-w-3xl leading-7 text-[var(--text-soft)]">
              More original cooking videos, practical methods and stories from my
              kitchen are coming next. Vegan food, cooked with love.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/about"
              className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Read my story
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-[var(--border)] bg-black/10 px-5 py-3 text-sm font-bold text-[var(--brand-gold)] transition hover:bg-black/20"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
      {process.env.NODE_ENV === "development" && (
        <section className="mt-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
            Local admin tools
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">
            Development tools
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/import"
              className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white shadow transition hover:opacity-90"
            >
              Import
            </Link>
            <Link
              href="/admin/pipeline"
              className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white shadow transition hover:opacity-90"
            >
              Pipeline
            </Link>
            <Link
              href="/admin/social"
              className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white shadow transition hover:opacity-90"
            >
              Social
            </Link>
          </div>
        </section>
      )}

    </main>
  );
}
