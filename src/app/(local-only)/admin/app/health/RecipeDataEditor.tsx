"use client";

import { LoaderCircle, Save, Tags, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TAGS = [["quick", "Quick"], ["low-cost", "Low cost"], ["high-protein", "High protein"], ["family-friendly", "Family friendly"]] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export default function RecipeDataEditor({ slug, initialTags, initialIngredients, steps, initialVideos }: { slug: string; initialTags: string[]; initialIngredients: string[]; steps: string[]; initialVideos: Array<string | null> }) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [videos, setVideos] = useState(() => steps.map((_, index) => initialVideos[index] ?? ""));
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  async function save(action: "plannerTags" | "ingredients" | "stepVideos", payload: object) {
    setState("saving"); setMessage("");
    try {
      const response = await fetch("/api/admin/app/recipe-health", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, slug, ...payload }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save.");
      setState("saved"); setMessage("Saved. The health report has been updated."); router.refresh();
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Unable to save."); }
  }

  return <div className="mt-3 grid gap-3">
    <details className="rounded-2xl border border-[var(--border)] bg-black/20 p-4"><summary className="cursor-pointer list-none font-extrabold text-[var(--brand-gold)]"><span className="inline-flex items-center gap-2"><Tags aria-hidden="true" size={18} /> Planner preferences</span></summary><p className="mt-2 text-sm text-[var(--text-soft)]">Select only qualities that genuinely describe this recipe.</p><div className="mt-3 flex flex-wrap gap-2">{TAGS.map(([value, label]) => <button key={value} type="button" aria-pressed={tags.includes(value)} onClick={() => setTags((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className={`rounded-full border px-3 py-2 text-sm font-bold ${tags.includes(value) ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] text-[var(--text-soft)]"}`}>{label}</button>)}</div><button type="button" onClick={() => void save("plannerTags", { plannerTags: tags })} className="mt-3 rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white">Save preferences</button></details>
    <details className="rounded-2xl border border-[var(--border)] bg-black/20 p-4"><summary className="cursor-pointer list-none font-extrabold text-[var(--brand-gold)]">Review ingredient wording</summary><p className="mt-2 text-sm text-[var(--text-soft)]">Use a clear amount, unit and supermarket product. Write “as needed” when there is no fixed quantity.</p><div className="mt-3 space-y-2">{ingredients.map((ingredient, index) => <label key={index} className="grid grid-cols-[2rem_1fr] items-center gap-2 text-xs text-[var(--text-soft)]"><span>{index + 1}</span><input value={ingredient} onChange={(event) => setIngredients((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="rounded-xl border border-[var(--border)] bg-[#10191e] px-3 py-2.5 text-sm text-white" /></label>)}</div><button type="button" onClick={() => void save("ingredients", { ingredients })} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white"><Save aria-hidden="true" size={16} /> Save ingredients</button></details>
    <details className="rounded-2xl border border-[var(--border)] bg-black/20 p-4"><summary className="cursor-pointer list-none font-extrabold text-[var(--brand-gold)]"><span className="inline-flex items-center gap-2"><Video aria-hidden="true" size={18} /> Step videos</span></summary><p className="mt-2 text-sm text-[var(--text-soft)]">Paste an approved hosted video link beside any step. Blank steps keep the current visual placeholder.</p><div className="mt-3 space-y-3">{steps.map((step, index) => <label key={index} className="block"><span className="line-clamp-1 text-xs text-[var(--text-soft)]">Step {index + 1}: {step}</span><input type="url" value={videos[index]} onChange={(event) => setVideos((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="https://…/step-video.mp4" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[#10191e] px-3 py-2.5 text-sm text-white" /></label>)}</div><button type="button" onClick={() => void save("stepVideos", { stepVideos: videos })} className="mt-3 rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white">Save video links</button></details>
    {message && <p role="status" className={`inline-flex items-center gap-2 text-sm font-bold ${state === "error" ? "text-red-300" : "text-green-300"}`}>{state === "saving" && <LoaderCircle aria-hidden="true" size={15} className="animate-spin" />}{message}</p>}
  </div>;
}
