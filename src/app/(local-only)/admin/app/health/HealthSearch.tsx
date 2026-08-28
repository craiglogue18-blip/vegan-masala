"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function HealthSearch() {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const needle = query.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>("[data-health-recipe]").forEach((row) => { row.style.display = Boolean(needle) && !(row.dataset.healthRecipe ?? "").includes(needle) ? "none" : ""; });
  }, [query]);
  return <label className="relative mt-5 block"><Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" size={18} /><span className="sr-only">Search health report</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes or issues…" className="w-full rounded-xl border border-[var(--border)] bg-black/25 py-3 pl-11 pr-4 text-white outline-none focus:border-[var(--brand-gold)]" /></label>;
}
