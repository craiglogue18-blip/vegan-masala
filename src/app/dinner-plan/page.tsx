import type { Metadata } from "next";
import Image from "next/image";
import { DinnerPlanSignupForm } from "@/components/DinnerPlanSignupForm";

export const metadata: Metadata = {
  title: "Free 7-Day Vegan Indian Dinner Plan",
  description:
    "Seven flavour-packed vegan Indian dinners, one shopping list and practical preparation notes — free from Vegan Masala.",
};

export default function DinnerPlanPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <section className="relative grid overflow-hidden rounded-3xl border border-[var(--brand-gold)]/45 bg-black/75 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 p-8 sm:p-12 lg:p-14">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Free from the Vegan Masala kitchen
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Seven vegan Indian dinners. One easy week.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
            Take the decision out of dinner with seven satisfying recipes, one organised
            shopping list and practical prep notes.
          </p>
          <ul className="mt-6 grid gap-3 text-sm font-semibold text-white sm:grid-cols-2">
            <li>✓ Seven complete dinner ideas</li>
            <li>✓ One combined shopping list</li>
            <li>✓ Proper Indian flavour</li>
            <li>✓ Free instant PDF download</li>
          </ul>
          <DinnerPlanSignupForm />
        </div>

        <div className="relative min-h-[380px] border-t border-[var(--border)] bg-black/40 lg:min-h-full lg:border-l lg:border-t-0">
          <Image
            src="/social/dinner-plan-launch/instagram-facebook-dinner-plan.png"
            alt="A colourful selection of dishes from the Vegan Masala seven-day dinner plan"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-contain p-4 sm:p-7"
            unoptimized
          />
        </div>
      </section>
    </main>
  );
}
