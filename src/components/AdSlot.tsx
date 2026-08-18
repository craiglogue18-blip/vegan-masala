"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdSlotProps = { slot: string; label?: string; className?: string };
const ADSENSE_CLIENT = "ca-pub-8611934119496722";

export default function AdSlot({ slot, label = "Advertisement", className = "" }: AdSlotProps) {
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // A declined or deferred ad request must never affect the recipe page.
    }
  }, [enabled]);

  if (!enabled || !slot) return null;

  return (
    <aside aria-label={label} className={className}>
      <p className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]/60">{label}</p>
      <ins
        className="adsbygoogle block min-h-[90px] overflow-hidden"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
