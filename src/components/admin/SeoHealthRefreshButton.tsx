"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function SeoHealthRefreshButton() {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={refreshing}
      onClick={() => startTransition(() => router.refresh())}
      className="rounded-xl border border-[var(--border)] bg-black/20 px-4 py-2 font-bold text-[var(--brand-gold)] transition hover:bg-black/30 disabled:cursor-wait disabled:opacity-60"
    >
      {refreshing ? "Rescanning…" : "Rescan SEO health"}
    </button>
  );
}
