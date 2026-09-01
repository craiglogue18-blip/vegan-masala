// src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getPublicRecipes } from "@/lib/recipes";
import { getAllGuides } from "@/lib/guides";
import { getRecipeImage, isPlaceholderImage } from "@/lib/recipeimages";
import CurrySlider from "@/components/CurrySlider";
import DinnerPlanPromo from "@/components/DinnerPlanPromo";
import DinnerFinder from "@/components/DinnerFinder";
import TrendingRecipes from "@/components/TrendingRecipes";
import RecipeVideoShowcase from "@/components/RecipeVideoShowcase";
import homeSeasonal from "@/data/homeSeasonal.json";

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

function cleanLabel(label?: string) {
  if (!label) return "";
  return label.replace(/\s*\((recipe|guide)\)\s*$/i, "").trim();
}

function getGuideImage(slug: string, image?: string) {
  if (image) return image;
  return `/images/guides/${slug}.png`;
}

export default function Home() {
  const recipes = getPublicRecipes();
  const guides = getAllGuides();

  const latestRecipes = recipes.slice(0, 6);
  const featuredRecipes = recipes.slice(0, 3);
  const featuredGuides = guides.slice(0, 3);
  const finderRecipes = recipes.slice(0, 40).map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description || "",
    image: getRecipeImage(recipe.slug),
    totalMinutes: (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0),
    spice: recipe.spiceLevel || recipe.spice || "",
    searchText: [
      recipe.title,
      recipe.description,
      ...(recipe.tags || []),
      ...(recipe.ingredients || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));
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

  const currySliderImages = [
    {
      src: "/images/curries/curry_1.jpg",
      alt: "Vegan Indian curry in rich masala sauce",
    },
    {
      src: "/images/curries/curry_2.jpg",
      alt: "Bowl of vegan Indian curry",
    },
    {
      src: "/images/curries/curry_3.jpg",
      alt: "Homemade vegan Indian curry with deep red gravy",
    },
    {
      src: "/images/curries/curry_4.jpg",
      alt: "Vegan Indian curry served for dinner",
    },
    {
      src: "/images/curries/curry_5.jpg",
      alt: "Close-up of vegan Indian curry",
    },
    {
      src: "/images/curries/curry_6.jpg",
      alt: "Vegan Indian curry with rich tomato masala",
    },
  ];

  const collections = [
    {
      label: "30-minute meals",
      href: "/recipes?collection=30-min",
      desc: "Fast, bold, weeknight-friendly recipes.",
      image: "/images/home/collections/quick-meals.webp",
    },
    {
      label: "One-pot favourites",
      href: "/recipes?collection=one-pot",
      desc: "Less washing up, plenty of flavour.",
      image: "/images/home/collections/one-pot.webp",
    },
    {
      label: "Dal & lentils",
      href: "/recipes?collection=dal",
      desc: "Comforting staples for everyday cooking.",
      image: "/images/home/collections/dal-lentils.webp",
    },
    {
      label: "Curries",
      href: "/recipes?tag=curry",
      desc: "Rich masalas and deeply warming sauces.",
      image: "/images/home/collections/curries.webp",
    },
    {
      label: "Snacks & street food",
      href: "/recipes?tag=snacks",
      desc: "Crisp, savoury favourites made for sharing.",
      image: "/images/home/collections/snacks.webp",
    },
  ];

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

  const browseSections = [
    {
      title: "Curries",
      href: "/recipes",
      desc: "Rich, warming classics and cosy everyday favourites.",
    },
    {
      title: "Flatbreads",
      href: "/recipes?tag=flatbread",
      desc: "Chapati, naan and Indian side staples.",
    },
    {
      title: "Snacks",
      href: "/recipes?tag=snacks",
      desc: "Crispy pakoras, bhajis and comfort-food bites.",
    },
    {
      title: "Guides",
      href: "/guides",
      desc: "Learn spices, pantry basics and Indian cooking techniques.",
    },
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
                href="#dinner-finder"
                className="rounded-xl bg-[var(--brand-red)] px-6 py-3 font-bold text-white shadow transition hover:opacity-90"
              >
                Find tonight’s recipe
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

      <div className="mt-10">
        <DinnerFinder recipes={finderRecipes} />
      </div>

      <div className="mt-10">
        <DinnerPlanPromo placement="homepage" />
      </div>

      <section className="vm-rise mt-12 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/45 bg-[var(--surface)] shadow-lg">
        <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">
              {homeSeasonal.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[var(--brand-gold)] sm:text-4xl">
              {homeSeasonal.title}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--text-soft)]">
              {homeSeasonal.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-extrabold text-[var(--brand-gold)]">
              {['Aubergine', 'Spinach', 'Tomato', 'Chickpeas', 'Warming spices'].map((ingredient) => (
                <span key={ingredient} className="rounded-full border border-[var(--border)] bg-black/15 px-3 py-2">
                  {ingredient}
                </span>
              ))}
            </div>
            <Link href="/recipes?search=aubergine" className="mt-7 inline-flex rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-95">
              {homeSeasonal.cta}
            </Link>
          </div>
          <div className="relative min-h-[280px] overflow-hidden bg-black/20 lg:min-h-full">
            <Image src="/images/home/collections/curries.webp" alt="A warming vegan Indian curry for the changing season" fill className="object-cover transition duration-700 hover:scale-[1.02]" sizes="(max-width: 1024px) 100vw, 48vw" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTIONS */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
              Cook by mood
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">
              Cook by collection
            </h2>
          </div>

          <Link
            href="/recipes"
            className="text-sm font-bold text-[var(--text-soft)] hover:underline"
          >
            View all recipes →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {collections.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-32 overflow-hidden bg-black/20">
                <Image src={c.image} alt="" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 240px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="p-5">
                <div className="text-base font-extrabold text-[var(--brand-gold)]">
                  {c.label}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {c.desc}
                </p>
              </div>
            </Link>
          ))}
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
          {featuredRecipes.map((recipe: any) => {
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

                  {!!recipe.tags?.length && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {recipe.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-xl border border-[var(--border)] bg-black/10 px-3 py-1 text-xs font-extrabold text-[var(--brand-gold)]"
                        >
                          {cleanLabel(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <RecipeVideoShowcase />

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

      {/* BROWSE THE SITE */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-[var(--brand-gold)]">
          Explore Vegan Masala
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {browseSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:bg-black/20"
            >
              <h3 className="text-base font-extrabold text-[var(--brand-gold)]">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                {section.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST RECIPES */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-[var(--brand-gold)]">
            Recently added recipes
          </h2>

          <Link
            href="/recipes"
            className="text-sm font-bold text-[var(--text-soft)] hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latestRecipes.map((r: any) => {
            const img = getRecipeImage(r.slug);
            const placeholder = isPlaceholderImage(img);
            const time = minutes(r.prepMinutes, r.cookMinutes);

            return (
              <Link
                key={r.slug}
                href={`/recipes/${r.slug}`}
                className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:bg-black/20"
              >
                <div className="relative h-48 w-full bg-black/25">
                  <Image
                    src={img}
                    alt={r.title}
                    fill
                    className={
                      placeholder ? "object-contain p-10 opacity-90" : "object-cover"
                    }
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />

                  {time ? (
                    <div className="absolute right-3 top-3 rounded-xl bg-[var(--brand-red)] px-3 py-1 text-xs font-extrabold text-white shadow">
                      {time}
                    </div>
                  ) : null}
                </div>

                <div className="p-5">
                  <h3 className="text-base font-extrabold text-[var(--brand-gold)] group-hover:underline">
                    {r.title}
                  </h3>

                  {r.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--text-soft)]">
                      {r.description}
                    </p>
                  ) : null}

                  {!!r.tags?.length && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.tags.slice(0, 3).map((t: string) => (
                        <span
                          key={t}
                          className="rounded-xl border border-[var(--border)] bg-black/10 px-3 py-1 text-xs font-extrabold text-[var(--brand-gold)]"
                        >
                          {cleanLabel(t)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ABOUT / BRAND */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
            About Vegan Masala
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">
            Vegan Indian food written with warmth, care and real kitchen knowledge
          </h2>

          <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
            Vegan Masala is built around the belief that vegan Indian cooking
            should never feel like a compromise. The best dishes rely on a
            properly cooked masala, balanced spices, confidence with technique
            and an understanding of how flavour is built layer by layer.
          </p>

          <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
            This is food with the spirit of family meals in it: curries, dals,
            flatbreads and everyday favourites made to be shared, remembered and
            cooked again. The aim is to offer recipes and guides that feel warm
            and welcoming, while still speaking to people who care deeply about
            Indian food and want to cook it well.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
            Follow the journey
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">
            A growing vegan Indian kitchen
          </h2>

          <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
            Vegan Masala is growing into a fuller recipe and guide library with
            more curries, more regional inspiration, stronger kitchen guidance
            and more of the dishes that make Indian home cooking so memorable.
            Explore what is live now and follow along as the site continues to
            grow.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/recipes"
              className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Explore recipes
            </Link>

            <Link
              href="/guides"
              className="rounded-xl border border-[var(--border)] bg-black/10 px-5 py-3 text-sm font-bold text-[var(--brand-gold)] transition hover:bg-black/20"
            >
              Read guides
            </Link>
          </div>
        </div>
      </section>

      {/* SLIDER */}
      <section className="mt-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
              From the Vegan Masala kitchen
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">
              Curries, colour and everyday favourites
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black/20">
          <div className="relative h-[260px] sm:h-[340px] lg:h-[420px]">
            <CurrySlider images={currySliderImages} />
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
