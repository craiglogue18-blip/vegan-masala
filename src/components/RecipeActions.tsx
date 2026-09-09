"use client";

import { recordEngagement } from "@/lib/dinner-plan-tracking";

export default function RecipeActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <a
        href="#ingredients"
        onClick={() => recordEngagement("internal_cta_click", { placement: "jump-to-ingredients" })}
        className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Jump to ingredients
      </a>

      <button
        type="button"
        onClick={() => { recordEngagement("recipe_print"); window.print(); }}
        className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Print
      </button>
    </div>
  );
}
