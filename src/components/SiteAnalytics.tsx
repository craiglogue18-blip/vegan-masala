"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  analyticsSessionId,
  claimAnalyticsSessionEngaged,
  claimAnalyticsSessionStart,
  recordEngagement,
} from "@/lib/dinner-plan-tracking";

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    const sessionId = analyticsSessionId();
    if (claimAnalyticsSessionStart(sessionId)) {
      recordEngagement("session_start", { category: "session-v2" });
    }
    recordEngagement("page_view");

    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible" && claimAnalyticsSessionEngaged(sessionId)) {
        recordEngagement("session_engaged", {
          category: "session-v2",
          eventId: `session-engaged-${sessionId}`,
        });
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
    };
  }, [pathname]);

  return null;
}
