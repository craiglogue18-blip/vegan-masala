export const DINNER_PLAN_PENDING_KEY = "vegan-masala:dinner-plan:pending:v2";
export const DINNER_PLAN_COMPLETED_KEY = "vegan-masala:dinner-plan:completed:v2";
export const DINNER_PLAN_CONFIRMATION_RECORDED_KEY =
  "vegan-masala:dinner-plan:confirmation-recorded:v2";
const SESSION_KEY = "vegan-masala:analytics-session:v1";
const ATTRIBUTION_KEY = "vegan-masala:analytics-attribution:v1";

type Attribution = {
  source: string;
  medium: string;
  campaign: string;
  placement: string;
  landingPage: string;
};

function safeStorage(storage: Storage, key: string) {
  try { return storage.getItem(key); } catch { return null; }
}

export function analyticsSessionId() {
  const existing = safeStorage(window.sessionStorage, SESSION_KEY);
  if (existing) return existing;
  const created = createDinnerPlanSignupId();
  try { window.sessionStorage.setItem(SESSION_KEY, created); } catch {}
  return created;
}

export function sessionAttribution(): Attribution {
  const existing = safeStorage(window.sessionStorage, ATTRIBUTION_KEY);
  if (existing) {
    try { return JSON.parse(existing) as Attribution; } catch {}
  }
  const params = new URLSearchParams(window.location.search);
  let referrer = "direct";
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== window.location.hostname.replace(/^www\./, "")) referrer = host;
    }
  } catch {}
  const value = {
    source: params.get("utm_source") || referrer,
    medium: params.get("utm_medium") || (referrer === "direct" ? "none" : "referral"),
    campaign: params.get("utm_campaign") || "none",
    placement: params.get("utm_content") || "none",
    landingPage: window.location.pathname,
  };
  try { window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value)); } catch {}
  return value;
}

export function createDinnerPlanSignupId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `vm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function recordEngagement(
  event: string,
  details: Record<string, string | undefined> = {},
) {
  const attribution = sessionAttribution();
  const body = JSON.stringify({
    event,
    eventId: createDinnerPlanSignupId(),
    sessionId: analyticsSessionId(),
    pagePath: window.location.pathname,
    source: attribution.source,
    medium: attribution.medium,
    campaign: attribution.campaign,
    placement: attribution.placement,
    landingPage: attribution.landingPage,
    device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop",
    ...details,
  });

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
