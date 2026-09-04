export const DINNER_PLAN_PENDING_KEY = "vegan-masala:dinner-plan:pending:v2";
export const DINNER_PLAN_COMPLETED_KEY = "vegan-masala:dinner-plan:completed:v2";
export const DINNER_PLAN_CONFIRMATION_RECORDED_KEY =
  "vegan-masala:dinner-plan:confirmation-recorded:v2";

export function createDinnerPlanSignupId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `vm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function recordEngagement(
  event: string,
  details: Record<string, string | undefined> = {},
) {
  const body = JSON.stringify({ event, pagePath: window.location.pathname, ...details });

  if (typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(
      "/api/engagement",
      new Blob([body], { type: "application/json" }),
    );
    if (queued) return;
  }

  void fetch("/api/engagement", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
