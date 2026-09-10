import type { Metadata } from "next";
import Image from "next/image";
import {
  DinnerPlanPageTracker,
  DinnerPlanSignupForm,
} from "@/components/DinnerPlanSignupForm";

export const metadata: Metadata = {
  title: "Free 7-Day Vegan Indian Dinner Plan",
  description:
    "Seven flavour-packed vegan Indian dinners, one shopping list and practical preparation notes — free from Vegan Masala.",
};

export default function DinnerPlanPage() {
  const dinners = [
    ["Monday", "Chana Masala", "40 min"],
    ["Tuesday", "Creamy Red Lentil Dahl", "25 min"],
    ["Wednesday", "Palak Tofu Curry", "45 min"],
    ["Thursday", "Aloo Baingan Curry", "30 min"],
    ["Friday", "Mushroom Masala", "40 min"],
    ["Saturday", "Vegetable Biryani", "30 min"],
    ["Sunday", "Butter Bean Curry", "25 min"],
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-14">
      <DinnerPlanPageTracker />

      <section className="relative grid overflow-hidden rounded-3xl border border-[var(--brand-gold)]/45 bg-black/75 shadow-2xl lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative z-10 p-7 sm:p-10 lg:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Free 6-page printable plan
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-white sm:text-6xl">
            Stop wondering what to cook this week
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
            Get a complete week of satisfying vegan Indian dinners, organised into one
            practical plan you can save, print and actually follow.
          </p>
          <ul className="mt-6 grid gap-3 text-sm font-semibold text-white sm:grid-cols-2">
            <li className="rounded-xl bg-white/5 px-3 py-2">✓ 7 tested recipe links</li>
            <li className="rounded-xl bg-white/5 px-3 py-2">✓ One grouped shopping list</li>
            <li className="rounded-xl bg-white/5 px-3 py-2">✓ 25-45 minute dinners</li>
            <li className="rounded-xl bg-white/5 px-3 py-2">✓ Prep and leftover guidance</li>
          </ul>
          <DinnerPlanSignupForm placement="hero" />
        </div>

        <div className="relative min-h-[440px] border-t border-[var(--border)] bg-gradient-to-br from-[var(--brand-red)]/15 via-black/20 to-[var(--brand-gold)]/10 lg:min-h-full lg:border-l lg:border-t-0">
          <Image
            src="/social/dinner-plan-launch/instagram-facebook-dinner-plan.png"
            alt="A colourful selection of dishes from the Vegan Masala seven-day dinner plan"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-contain p-5 sm:p-8"
            unoptimized
          />
          <div className="absolute left-5 top-5 rounded-full bg-[var(--brand-gold)] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-black shadow-lg">
            Free instant download
          </div>
          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2">
            {[['7', 'dinners'], ['1', 'shopping list'], ['5', 'prep shortcuts']].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/15 bg-black/80 p-3 text-center backdrop-blur-sm">
                <strong className="block text-xl text-[var(--brand-gold)]">{value}</strong>
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 text-center text-sm font-semibold text-[var(--text-soft)] sm:grid-cols-3">
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">Created from Vegan Masala recipes</p>
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">No paid subscription</p>
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">Unsubscribe at any time</p>
      </div>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Your week, already decided</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">Seven proper dinners - not vague meal ideas</h2>
          <p className="mt-4 text-lg leading-8 text-[var(--text-soft)]">Every day includes a named dish, realistic cooking time, serving suggestion and a link to the complete recipe.</p>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dinners.map(([day, dish, time], index) => (
            <article key={day} className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${index === 6 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--brand-gold)]">{day}</span>
                <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-[var(--text-soft)]">{time}</span>
              </div>
              <h3 className="mt-3 text-xl font-extrabold text-white">{dish}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ["Shop once", "A grouped list covers fresh produce, tins and protein, rice and breads, plus the spices and pantry ingredients used through the week."],
          ["Prep without losing Sunday", "Five focused shortcuts remove repetitive chopping and blending in 30-45 minutes - without batch-cooking every meal."],
          ["Cook with more confidence", "Useful prompts cover rice safety, chilling leftovers, tasting for salt, chilli and acidity, and freezing spare portions."],
        ].map(([title, copy], index) => (
          <article key={title} className="rounded-3xl border border-[var(--brand-gold)]/25 bg-black/45 p-7">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-gold)] text-lg font-extrabold text-black">{index + 1}</span>
            <h2 className="mt-5 text-2xl font-extrabold text-[var(--brand-gold)]">{title}</h2>
            <p className="mt-3 leading-7 text-[var(--text-soft)]">{copy}</p>
          </article>
        ))}
      </section>

      <section className="my-14 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/40 bg-gradient-to-br from-[var(--brand-red)]/20 via-black/70 to-black/70 p-7 text-center sm:my-20 sm:p-12">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Make this week easier</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold text-white sm:text-5xl">Get the plan, shopping list and prep guide free</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">Enter your email and confirm it to open the PDF immediately. Save it on your phone or print the planning pages for the kitchen.</p>
        <div className="mx-auto max-w-2xl text-left">
          <DinnerPlanSignupForm placement="bottom" />
        </div>
      </section>

      <section className="mx-auto mb-10 max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold text-white">A few useful answers</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {[
            ["Is it genuinely free?", "Yes. There is no purchase or paid subscription required."],
            ["How many people does it feed?", "Each recipe serves approximately four, and the shopping list is planned on that basis."],
            ["Can I change the order?", "Absolutely. Swap days, repeat a favourite or freeze a portion - the plan is there to support real life."],
            ["What happens after I sign up?", "Confirm your email, then the download page opens with your PDF. You may also receive occasional Vegan Masala cooking inspiration."],
          ].map(([question, answer]) => (
            <article key={question} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h3 className="text-lg font-extrabold text-[var(--brand-gold)]">{question}</h3>
              <p className="mt-2 leading-7 text-[var(--text-soft)]">{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
