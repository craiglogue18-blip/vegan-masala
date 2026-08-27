"use client";

import { ArrowRight, Check, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  DEFAULT_PROFILE,
  PROFILE_KEY,
  PROFILE_SKIPPED_KEY,
  readPlannerProfile,
  type PlannerMeal,
  type PlannerPreference,
  type PlannerProfile,
} from "../profile";
import InstallAppButton from "../InstallAppButton";

const MEALS: PlannerMeal[] = ["Breakfast", "Lunch", "Dinner"];
const GOALS: { value: PlannerPreference; label: string; detail: string }[] = [
  { value: "Any", label: "A bit of everything", detail: "Keep my week varied" },
  { value: "Quick", label: "Save time", detail: "Prioritise meals around 30 minutes" },
  { value: "Low cost", label: "Spend less", detail: "Make affordable staples work harder" },
  { value: "High protein", label: "More protein", detail: "Prioritise beans, lentils and tofu" },
  { value: "Family friendly", label: "Please everyone", detail: "Start with gentler family favourites" },
];

export default function WelcomeProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlannerProfile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The saved profile only exists in the browser, so hydrate it after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(readPlannerProfile() ?? DEFAULT_PROFILE);
    setReady(true);
  }, []);

  function update<K extends keyof PlannerProfile>(key: K, value: PlannerProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleMeal(meal: PlannerMeal) {
    const next = profile.meals.includes(meal)
      ? profile.meals.filter((item) => item !== meal)
      : MEALS.filter((item) => [...profile.meals, meal].includes(item));
    if (next.length > 0) update("meals", next);
  }

  function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.removeItem(PROFILE_SKIPPED_KEY);
    router.push("/meal-planner/build");
  }

  function skipProfile() {
    localStorage.setItem(PROFILE_SKIPPED_KEY, "true");
    router.push("/meal-planner/build");
  }

  if (!ready) return <main className="min-h-[65vh]" aria-label="Loading welcome screen" />;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-12">
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/20">
        <div className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top_right,rgba(214,177,81,0.18),transparent_45%)] px-6 py-8 sm:px-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-gold)] text-black"><Leaf aria-hidden="true" /></div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Welcome to Vegan Masala</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Let&apos;s make this yours</h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--text-soft)]">Tell me a little about how you cook and I&apos;ll set up your planner around you. You can change any of this later.</p>
        </div>

        <div className="space-y-9 px-6 py-8 sm:px-10">
          <div className="grid gap-7 md:grid-cols-2">
            <label className="block">
              <span className="text-lg font-extrabold text-[var(--brand-gold)]">What should I call you?</span>
              <span className="mt-1 block text-sm text-[var(--text-soft)]">Optional — a first name or nickname is plenty.</span>
              <input value={profile.name} onChange={(event) => update("name", event.target.value.slice(0, 40))} placeholder="Your name" autoComplete="given-name" className="mt-3 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--brand-gold)]" />
            </label>

            <fieldset>
              <legend className="text-lg font-extrabold text-[var(--brand-gold)]">How many are you feeding?</legend>
              <p className="mt-1 text-sm text-[var(--text-soft)]">I&apos;ll use this as your planner default.</p>
              <div className="mt-3 inline-flex items-center rounded-xl border border-[var(--border)] bg-black/20 p-1">
                <button type="button" onClick={() => update("people", Math.max(1, profile.people - 1))} className="h-11 w-11 rounded-lg text-xl hover:bg-white/10" aria-label="Remove one person">−</button>
                <span className="w-20 text-center font-extrabold">{profile.people}</span>
                <button type="button" onClick={() => update("people", Math.min(8, profile.people + 1))} className="h-11 w-11 rounded-lg text-xl hover:bg-white/10" aria-label="Add one person">+</button>
              </div>
            </fieldset>
          </div>

          <fieldset>
            <legend className="text-lg font-extrabold text-[var(--brand-gold)]">How confident are you in the kitchen?</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(["New cook", "Comfortable", "Confident"] as const).map((option) => <Choice key={option} active={profile.confidence === option} onClick={() => update("confidence", option)} label={option} />)}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-lg font-extrabold text-[var(--brand-gold)]">What would help most right now?</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {GOALS.map((goal) => <Choice key={goal.value} active={profile.goal === goal.value} onClick={() => update("goal", goal.value)} label={goal.label} detail={goal.detail} />)}
            </div>
          </fieldset>

          <div className="grid gap-7 md:grid-cols-2">
            <fieldset>
              <legend className="text-lg font-extrabold text-[var(--brand-gold)]">Your usual spice level</legend>
              <div className="mt-3 flex gap-2">
                {(["Mild", "Medium", "Hot"] as const).map((option) => <Choice key={option} active={profile.spice === option} onClick={() => update("spice", option)} label={option} compact />)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-extrabold text-[var(--brand-gold)]">Meals you want to plan</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {MEALS.map((meal) => <Choice key={meal} active={profile.meals.includes(meal)} onClick={() => toggleMeal(meal)} label={meal} compact />)}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button type="button" onClick={skipProfile} className="text-sm font-bold text-[var(--text-soft)] underline underline-offset-4 hover:text-white">Skip for now</button>
              <p className="mt-1 text-xs text-[var(--text-soft)]">Saved only in this browser on this device.</p>
            </div>
            <button type="button" onClick={saveProfile} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-6 py-3.5 font-extrabold text-white hover:brightness-110">Set up my planner <ArrowRight aria-hidden="true" size={19} /></button>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/20 p-4">
            <p className="text-sm font-extrabold text-white">Keep Vegan Masala close</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">Install it on this device for a home-screen icon and a standalone app window.</p>
            <div className="mt-3"><InstallAppButton /></div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Choice({ active, onClick, label, detail, compact = false }: { active: boolean; onClick: () => void; label: string; detail?: string; compact?: boolean }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`relative flex ${compact ? "flex-1 justify-center px-3 py-3" : "min-h-16 px-4 py-3 text-left"} items-center gap-3 rounded-xl border font-bold transition ${active ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] bg-black/20 text-white hover:bg-white/10"}`}>{active && <Check aria-hidden="true" size={17} className="shrink-0" />}<span><span className="block">{label}</span>{detail && <span className={`mt-0.5 block text-xs font-normal ${active ? "text-black/70" : "text-[var(--text-soft)]"}`}>{detail}</span>}</span></button>;
}
