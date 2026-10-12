export const DINNER_PLAN_PENDING_KEY = "vegan-masala:dinner-plan:pending:v2";
export const DINNER_PLAN_COMPLETED_KEY = "vegan-masala:dinner-plan:completed:v2";
export const DINNER_PLAN_CONFIRMATION_RECORDED_KEY =
  "vegan-masala:dinner-plan:confirmation-recorded:v2";
export const SIGNUP_OFFER_KEY = "vegan-masala:signup-offer:v1";
const SESSION_KEY = "vegan-masala:analytics-session:v2";
const ATTRIBUTION_KEY = "vegan-masala:analytics-attribution:v2";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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

type AnalyticsSession = {
  id: string;
  lastActive: number;
  started?: boolean;
  engaged?: boolean;
};

function readAnalyticsSession(): AnalyticsSession | null {
  const existing = safeStorage(window.localStorage, SESSION_KEY);
  if (!existing) return null;
  try {
    const parsed = JSON.parse(existing) as Partial<AnalyticsSession>;
    if (typeof parsed.id === "string" && typeof parsed.lastActive === "number") {
      return {
        id: parsed.id,
        lastActive: parsed.lastActive,
        started: parsed.started === true,
        engaged: parsed.engaged === true,
      };
    }
  } catch {}
  return null;
}

export function analyticsSessionId() {
  const now = Date.now();
  const existing = readAnalyticsSession();
  const session = existing && now - existing.lastActive < SESSION_TIMEOUT_MS
    ? { ...existing, lastActive: now }
    : { id: createDinnerPlanSignupId(), lastActive: now };
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  return session.id;
}

export function claimAnalyticsSessionStart(sessionId: string) {
  const session = readAnalyticsSession();
  if (!session || session.id !== sessionId || session.started) return false;
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, started: true })); } catch {}
  return true;
}

export function claimAnalyticsSessionEngaged(sessionId: string) {
  const session = readAnalyticsSession();
  if (!session || session.id !== sessionId || session.engaged) return false;
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, engaged: true })); } catch {}
  return true;
}

export function sessionAttribution(sessionId = analyticsSessionId()): Attribution {
  const attributionKey = `${ATTRIBUTION_KEY}:${sessionId}`;
  const existing = safeStorage(window.localStorage, attributionKey);
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
  try { window.localStorage.setItem(attributionKey, JSON.stringify(value)); } catch {}
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
  const sessionId = analyticsSessionId();
  const attribution = sessionAttribution(sessionId);
  const body = JSON.stringify({
    event,
    eventId: createDinnerPlanSignupId(),
    sessionId,
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
