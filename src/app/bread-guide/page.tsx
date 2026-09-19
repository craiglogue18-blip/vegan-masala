import type { Metadata } from "next";
import Image from "next/image";

import {
  BreadGuidePageTracker,
  DinnerPlanSignupForm,
} from "@/components/DinnerPlanSignupForm";

export const metadata: Metadata = {
  title: "Free Authentic Indian Vegan Breads Guide",
  description:
    "Get Vegan Masala's free illustrated guide to roti, naan, poori, regional breads, tandoor technique and confident home bread-making.",
};

const guideIncludes = [
  "Roti, naan, poori and regional bread traditions",
  "Tandoor, tawa, rolling and hand-forming techniques",
  "Flour, dough, heat and troubleshooting guidance",
  "The cultural place of bread at the Indian table",
  "Four Vegan Masala bread recipes",
  "Transparent ingredient and equipment recommendations",
];

export default function BreadGuidePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-14">
      <BreadGuidePageTracker />

      <section className="grid overflow-hidden rounded-3xl border border-[var(--brand-gold)]/55 bg-black/70 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            A free illustrated guide from Vegan Masala
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-white sm:text-6xl">
            Authentic Indian vegan breads, made approachable
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
            Learn how roti, naan, poori and regional breads are shaped, cooked and
            enjoyed—with practical techniques for a real home kitchen.
          </p>

          <DinnerPlanSignupForm
            placement="bread-guide-hero"
            offer="bread-guide"
          />

          <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]/80">
            Your confirmed signup unlocks the bread guide immediately, plus our free
            seven-day vegan Indian dinner plan.
          </p>
        </div>

        <div className="relative min-h-[430px] border-t border-[var(--border)] lg:min-h-full lg:border-l lg:border-t-0">
          <Image
            src="/social/1000-followers-bread-guide/01-thank-you-1000.png"
            alt="Vegan Masala celebration and authentic Indian vegan breads guide"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-contain p-5 sm:p-8"
            unoptimized
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Inside the guide
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">
            More than a collection of recipes
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--text-soft)]">
            This guide explains the ingredients, tools, cultural context and physical
            techniques that make Indian breads so varied and rewarding.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guideIncludes.map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-[var(--brand-gold)]/30 bg-black/50 p-5 text-base font-bold leading-7 text-white"
            >
              <span className="mr-2 text-[var(--brand-gold)]">✓</span>
              {item}
            </article>
          ))}
        </div>
      </section>

      <section className="grid overflow-hidden rounded-3xl border border-[var(--brand-gold)]/40 bg-black/60 md:grid-cols-2">
        <div className="relative min-h-[340px]">
          <Image
            src="/images/editorial/home-kitchen-chapati.jpg"
            alt="Indian bread being cooked and served in a home kitchen"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="p-7 sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Why bread matters
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">
            Everyday food, technique and hospitality
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-soft)]">
            Indian breads can be inexpensive everyday staples, edible utensils for
            gathering dal and sabzi, and expressions of regional grain, heat and
            tradition. The guide explores that context without pretending there is one
            single Indian bread culture.
          </p>
          <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]/75">
            Some optional equipment and ingredient links are affiliate links. Any
            commission supports Vegan Masala at no additional cost to you, and every
            recommendation is clearly disclosed.
          </p>
        </div>
      </section>

      <section className="my-14 rounded-3xl border border-[var(--brand-gold)]/45 bg-gradient-to-br from-[var(--brand-red)]/20 via-black/75 to-black/75 p-7 text-center sm:my-20 sm:p-12">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
          Ready to start?
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">
          Get the free bread guide
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
          Enter your email, confirm it, and open both Vegan Masala guides immediately.
        </p>
        <div className="mx-auto max-w-2xl text-left">
          <DinnerPlanSignupForm
            placement="bread-guide-bottom"
            offer="bread-guide"
          />
        </div>
      </section>
    </main>
  );
}
