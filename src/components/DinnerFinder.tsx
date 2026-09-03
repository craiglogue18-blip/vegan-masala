"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type FinderRecipe = {
  slug: string;
  title: string;
  description: string;
  image: string;
  totalMinutes: number;
  spice: string;
  searchText: string;
};

type Props = { recipes: FinderRecipe[] };

const timeOptions = [
  { label: "Under 30 min", value: "30" },
  { label: "Under 60 min", value: "60" },
  { label: "Weekend cook", value: "any" },
];

const cravingOptions = [
  { label: "Comforting", value: "comfort" },
  { label: "Fresh & vibrant", value: "fresh" },
  { label: "Hot & bold", value: "hot" },
  { label: "Surprise me", value: "any" },
];

const cravingWords: Record<string, string[]> = {
  comfort: ["creamy", "comfort", "dal", "coconut", "potato", "warming"],
  fresh: ["fresh", "spinach", "okra", "herb", "vegetable", "salad"],
  hot: ["hot", "spicy", "madras", "chilli", "vindaloo", "fiery"],
};

export default function DinnerFinder({ recipes }: Props) {
  const [time, setTime] = useState("60");
  const [craving, setCraving] = useState("comfort");
  const [ingredient, setIngredient] = useState("any");

  const matches = useMemo(() => {
    return recipes
      .map((recipe, index) => {
        let score = Math.max(0, 20 - index);
        const limit = time === "any" ? Infinity : Number(time);
        if (recipe.totalMinutes > 0 && recipe.totalMinutes <= limit) score += 35;
        if (ingredient !== "any" && recipe.searchText.includes(ingredient)) score += 45;
        if (craving !== "any") {
          score += (cravingWords[craving] || []).filter((word) =>
            recipe.searchText.includes(word)
          ).length * 18;
        }
        if (craving === "hot" && /hot|spicy|fiery/i.test(recipe.spice)) score += 25;
        return { ...recipe, score };
      })
      .filter((recipe) => {
        const limit = time === "any" ? Infinity : Number(time);
        const fitsTime = !recipe.totalMinutes || recipe.totalMinutes <= limit;
        const fitsIngredient = ingredient === "any" || recipe.searchText.includes(ingredient);
        return fitsTime && fitsIngredient;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [craving, ingredient, recipes, time]);

  return (
    <section
      id="dinner-finder"
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/25 bg-[var(--surface)] shadow-lg"
    >
      <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
        <div className="relative overflow-hidden border-b border-[var(--brand-gold)]/20 bg-gradient-to-br from-[#172129] via-[#111a20] to-[#0b1217] p-7 text-[var(--text)] lg:border-b-0 lg:border-r sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border-[38px] border-[var(--brand-gold)]/5" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[var(--brand-gold)]/5 blur-3xl" />
          <p className="relative text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">
            Tonight, sorted
          </p>
          <h2 className="relative mt-3 text-3xl font-extrabold leading-tight text-[var(--brand-gold)]">
            What should I cook?
          </h2>
          <p className="relative mt-3 max-w-md leading-7 text-[var(--text-soft)]">
            Tell us what kind of evening you are having. We’ll find three recipes
            from the Vegan Masala kitchen—instantly.
          </p>

          <div className="relative mt-7 space-y-5">
            <ChoiceGroup label="How much time?" value={time} options={timeOptions} onChange={setTime} />
            <ChoiceGroup label="What are you craving?" value={craving} options={cravingOptions} onChange={setCraving} />

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold">Main ingredient</span>
              <select
                value={ingredient}
                onChange={(event) => setIngredient(event.target.value)}
                className="w-full rounded-xl border border-[var(--brand-gold)]/30 bg-black/20 px-4 py-3 font-bold text-[var(--text)] outline-none transition focus:border-[var(--brand-gold)]/70"
              >
                <option className="text-black" value="any">Anything</option>
                <option className="text-black" value="chickpea">Chickpeas</option>
                <option className="text-black" value="potato">Potato</option>
                <option className="text-black" value="dal">Dal or lentils</option>
                <option className="text-black" value="tofu">Tofu</option>
                <option className="text-black" value="spinach">Spinach</option>
              </select>
            </label>
          </div>
        </div>

        <div className="p-7 sm:p-9">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
                Your matches
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[var(--brand-gold)]">
                Dinner ideas for right now
              </h3>
            </div>
            <Link href="/recipes" className="hidden text-sm font-bold text-[var(--text-soft)] hover:underline sm:block">
              See everything →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {matches.map((recipe, index) => (
              <Link
                key={recipe.slug}
                href={`/recipes/${recipe.slug}`}
                className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-black/10 transition hover:-translate-y-1 hover:bg-black/20 hover:shadow-lg"
              >
                <div className="relative h-36 bg-black/20">
                  <Image src={recipe.image} alt={recipe.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 220px" />
                  {index === 0 ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[var(--brand-gold)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#111820] shadow-sm">
                      Best match
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <h4 className="font-extrabold leading-snug text-[var(--brand-gold)] group-hover:underline">
                    {recipe.title}
                  </h4>
                  <p className="mt-2 text-xs font-bold text-[var(--text-soft)]">
                    {recipe.totalMinutes ? `${recipe.totalMinutes} minutes` : "Take your time"} · View recipe →
                  </p>
                </div>
              </Link>
            ))}
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--brand-gold)]/45 bg-black/10 p-6 sm:col-span-3">
                <h4 className="font-extrabold text-[var(--brand-gold)]">
                  No exact match—yet
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  Try allowing a little more time or choosing “Anything”. We’ll keep
                  adding recipes, so this finder gets better as the kitchen grows.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-extrabold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-2 text-xs font-extrabold transition ${
              value === option.value
                ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#111820] shadow-sm"
                : "border-[var(--brand-gold)]/25 bg-black/15 text-[var(--text-soft)] hover:border-[var(--brand-gold)]/60 hover:text-[var(--text)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
