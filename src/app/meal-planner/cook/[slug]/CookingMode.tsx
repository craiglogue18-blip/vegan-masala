"use client";

import { Capacitor } from "@capacitor/core";
import { Haptics, NotificationType } from "@capacitor/haptics";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, ListChecks, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CookingRecipe = { slug: string; title: string; image?: string; ingredients: string[]; steps: string[]; totalMinutes: number };
type WakeLockSentinel = { release: () => Promise<void>; released: boolean };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } };

function timerMinutes(step: string) {
  const match = step.match(/\b(\d+)\s*(?:-|–|to)?\s*\d*\s*(?:minutes?|mins?)\b/i);
  return match ? Number(match[1]) : null;
}

function timerLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function CookingMode({ recipe, batchMultiplier = 1 }: { recipe: CookingRecipe; batchMultiplier?: number }) {
  const [step, setStep] = useState(0);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const currentStep = recipe.steps[step] ?? "";
  const suggestedTimer = useMemo(() => timerMinutes(currentStep), [currentStep]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0) {
      if (Capacitor.isNativePlatform()) {
        void Haptics.notification({ type: NotificationType.Success });
      } else {
        window.navigator.vibrate?.([200, 100, 200]);
      }
      document.title = `Timer finished · ${recipe.title}`;
    }
  }, [recipe.title, secondsLeft]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let active = true;

    const keepScreenAwake = async () => {
      try {
        const wakeLock = (navigator as WakeLockNavigator).wakeLock;
        if (active && wakeLock && document.visibilityState === "visible") lock = await wakeLock.request("screen");
      } catch {
        // Wake Lock is optional; cooking mode remains fully usable without it.
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && (!lock || lock.released)) void keepScreenAwake();
    };

    void keepScreenAwake();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (lock && !lock.released) void lock.release();
    };
  }, []);

  function toggleIngredient(index: number) {
    setCheckedIngredients((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-[#0b1216] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <Link href="/meal-planner" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-bold text-[var(--text-soft)] hover:text-white"><X aria-hidden="true" size={18} /> Exit</Link>
        <button type="button" onClick={() => setIngredientsOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-3 py-2 text-sm font-extrabold text-black"><ListChecks aria-hidden="true" size={18} /> Ingredients</button>
      </div>

      <section className="mx-auto mt-5 max-w-4xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/20">
        <div className="relative h-44 sm:h-56">
          <Image src={recipe.image || "/brand/logo-mark.png"} alt="" fill priority sizes="(max-width: 768px) 100vw, 896px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10191e] via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Cooking mode</p>
            <h1 className="mt-1 text-2xl sm:text-4xl">{recipe.title}</h1>
          </div>
        </div>

        {recipe.steps.length ? (
          <div className="p-5 sm:p-8">
            {batchMultiplier > 1 && <div className="mb-5 rounded-2xl border border-green-800/70 bg-green-950/35 p-4"><p className="font-extrabold text-green-300">Batch-cooking tonight</p><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">Make double the listed ingredient quantities. Serve half now and refrigerate half for tomorrow&apos;s lunch.</p></div>}
            <div className="flex items-center justify-between gap-4 text-sm font-bold text-[var(--text-soft)]">
              <span>Step {step + 1} of {recipe.steps.length}</span>
              {recipe.totalMinutes > 0 && <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" size={16} /> About {recipe.totalMinutes} min</span>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-[var(--brand-gold)] transition-all" style={{ width: `${((step + 1) / recipe.steps.length) * 100}%` }} /></div>

            <div className="flex min-h-64 items-center py-8 sm:min-h-72">
              <p className="text-2xl font-semibold leading-relaxed text-white sm:text-3xl">{currentStep}</p>
            </div>

            {(suggestedTimer || secondsLeft !== null) && <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-black/20 p-4">
              {secondsLeft === null ? <><Clock3 aria-hidden="true" className="text-[var(--brand-gold)]" /><span className="text-sm font-bold">This step mentions {suggestedTimer} minutes.</span><button type="button" onClick={() => setSecondsLeft((suggestedTimer ?? 0) * 60)} className="ml-auto rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white">Start timer</button></> : <><Clock3 aria-hidden="true" className={secondsLeft === 0 ? "text-green-300" : "text-[var(--brand-gold)]"} /><span className="text-xl font-extrabold">{secondsLeft === 0 ? "Timer finished" : timerLabel(secondsLeft)}</span><button type="button" onClick={() => setSecondsLeft(null)} className="ml-auto text-sm font-bold text-[var(--text-soft)] underline">Clear</button></>}
            </div>}

            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3.5 font-extrabold disabled:opacity-30"><ArrowLeft aria-hidden="true" size={19} /> Back</button>
              {step < recipe.steps.length - 1 ? <button type="button" onClick={() => setStep((value) => Math.min(recipe.steps.length - 1, value + 1))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-3.5 font-extrabold text-white">Next <ArrowRight aria-hidden="true" size={19} /></button> : <Link href="/meal-planner" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3.5 font-extrabold text-white"><Check aria-hidden="true" size={19} /> Finish</Link>}
            </div>
          </div>
        ) : <div className="p-8 text-center"><h2 className="text-2xl">Cooking mode isn&apos;t ready for this recipe yet</h2><p className="mt-2 text-[var(--text-soft)]">Its method is not structured into usable steps, so nothing has been rewritten or guessed.</p><Link href={`/recipes/${recipe.slug}`} className="mt-5 inline-flex rounded-xl bg-[var(--brand-red)] px-5 py-3 font-extrabold text-white">View the full recipe</Link></div>}
      </section>

      {ingredientsOpen && <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" role="presentation" onClick={() => setIngredientsOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Recipe ingredients" onClick={(event) => event.stopPropagation()} className="ml-auto h-full w-full max-w-md overflow-y-auto border-l border-[var(--border)] bg-[#10191e] p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-gold)]">Before you start</p><h2 className="mt-1 text-2xl">Ingredients</h2></div><button type="button" onClick={() => setIngredientsOpen(false)} aria-label="Close ingredients" className="rounded-xl border border-[var(--border)] p-2"><X aria-hidden="true" /></button></div><ul className="mt-6 divide-y divide-[var(--border)]">{recipe.ingredients.map((ingredient, index) => { const checked = checkedIngredients.includes(index); return <li key={`${ingredient}-${index}`}><button type="button" onClick={() => toggleIngredient(index)} className={`flex w-full items-start gap-3 py-4 text-left ${checked ? "text-[var(--text-soft)] line-through" : "text-white"}`}>{checked ? <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-green-300" size={20} /> : <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-[var(--border)]" />}<span>{ingredient}</span></button></li>; })}</ul></aside></div>}
    </main>
  );
}
