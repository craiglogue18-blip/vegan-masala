"use client";

import { LoaderCircle, RefreshCw, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "refresh" | "repair";

export default function HealthActions() {
  const router = useRouter();
  const [active, setActive] = useState<Action | null>(null);
  const [message, setMessage] = useState("");

  async function run(action: Action) {
    setActive(action);
    setMessage("");

    if (action === "repair") {
      try {
        const response = await fetch("/api/admin/app/recipe-health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "repairSafe" }),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to run repairs.");
        setMessage(result.message);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to run repairs.");
      }
    } else {
      setMessage("Recipe health rescanned with the latest website and app data.");
    }

    router.refresh();
    setActive(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={active !== null} onClick={() => void run("refresh")} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-gold)] disabled:opacity-50">
        {active === "refresh" ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <RefreshCw aria-hidden="true" size={17} />}
        {active === "refresh" ? "Rescanning…" : "Rescan recipe health"}
      </button>
      <button type="button" disabled={active !== null} onClick={() => void run("repair")} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-extrabold text-black disabled:opacity-50">
        {active === "repair" ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <WandSparkles aria-hidden="true" size={17} />}
        {active === "repair" ? "Fixing…" : "Fix safe weaknesses"}
      </button>
      {message && <p role="status" className="w-full text-sm font-bold text-green-300">{message}</p>}
    </div>
  );
}
