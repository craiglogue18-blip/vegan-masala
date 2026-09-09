"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analyticsSessionId, recordEngagement } from "@/lib/dinner-plan-tracking";

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    const sessionId = analyticsSessionId();
    const startedKey = `vegan-masala:session-started:${sessionId}`;
    if (!sessionStorage.getItem(startedKey)) {
      sessionStorage.setItem(startedKey, "1");
      recordEngagement("session_start");
    }
    recordEngagement("page_view");

    let engaged = false;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        engaged = true;
        recordEngagement("engaged_visit");
      }
    }, 30_000);

    const milestones = new Set<number>();
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available <= 0) return;
      const depth = Math.round((window.scrollY / available) * 100);
      for (const mark of [25, 50, 75, 90]) {
        if (depth >= mark && !milestones.has(mark)) {
          milestones.add(mark);
          recordEngagement("scroll_depth", { category: String(mark) });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      void engaged;
    };
  }, [pathname]);

  return null;
}
