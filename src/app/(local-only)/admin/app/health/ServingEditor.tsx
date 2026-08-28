"use client";

import { LoaderCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ServingEditor({ slug, current }: { slug: string; current?: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(current ?? 4));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/admin/app/recipe-health", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "servings", slug, servings: Number(value) }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save.");
      setState("saved");
      setMessage("Serving quantity saved. Shopping-list scaling has been updated.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-black/20 p-4">
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand-gold)] text-black"><Users aria-hidden="true" size={19} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-gold)]">Serving quantity</p><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">This is the number of people the listed ingredients normally feed. The app uses it to scale the weekly shopping list.</p></div></div>
      <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm font-bold text-[var(--text-soft)]">Serves{!current && <span className="ml-2 font-normal text-[var(--brand-gold)]">Suggested: 4</span>}<input type="number" inputMode="numeric" min="1" max="100" step="1" value={value} onChange={(event) => { setValue(event.target.value); setState("idle"); }} className="mt-2 block w-28 rounded-xl border border-[var(--border)] bg-[#10191e] px-4 py-2.5 text-lg font-extrabold text-white" /></label><button type="button" disabled={state === "saving" || !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 100} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40">{state === "saving" && <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />}{current ? "Update servings" : "Save servings"}</button>{message && <p role="status" className={`pb-2 text-sm font-bold ${state === "error" ? "text-red-300" : "text-green-300"}`}>{message}</p>}</div>
    </div>
  );
}
