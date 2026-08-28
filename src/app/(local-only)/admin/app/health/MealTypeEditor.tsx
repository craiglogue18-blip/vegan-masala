"use client";

import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { APP_MEAL_TYPES } from "@/lib/recipeAppHealth";

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function MealTypeEditor({ slug, current, suggested }: { slug: string; current: string[]; suggested: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggle(value: string) {
    setState("idle");
    setSelected((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  }

  async function save(values = selected) {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/admin/app/recipe-health", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mealTypes", slug, mealTypes: values }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save.");
      setSelected(values);
      setState("saved");
      setMessage("Classification saved. The health report has been updated.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-gold)]">Meal classification</p><p className="mt-1 text-sm text-[var(--text-soft)]">Breakfast, lunch and dinner enter meal plans. The other choices keep recipes available without using them as full meals.</p></div>{!current.length && <button type="button" disabled={state === "saving"} onClick={() => { setSelected(suggested); void save(suggested); }} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-extrabold text-black disabled:opacity-50"><Sparkles aria-hidden="true" size={17} /> Apply suggestion: {suggested.map(label).join(" + ")}</button>}</div>
      <div className="mt-4 flex flex-wrap gap-2">{APP_MEAL_TYPES.map((value) => { const active = selected.includes(value); return <button key={value} type="button" onClick={() => toggle(value)} aria-pressed={active} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold ${active ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] text-[var(--text-soft)]"}`}>{active && <Check aria-hidden="true" size={15} />}{label(value)}</button>; })}</div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={!selected.length || state === "saving"} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40">{state === "saving" && <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />}Save classification</button>{message && <p role="status" className={`text-sm font-bold ${state === "error" ? "text-red-300" : "text-green-300"}`}>{message}</p>}</div>
    </div>
  );
}
